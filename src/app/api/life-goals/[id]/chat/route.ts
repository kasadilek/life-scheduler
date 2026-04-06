import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { getInterviewPrompt, getAdaptationInterviewPrompt } from "@/lib/prompts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

function buildProgressSummary(milestones: { title: string; status: string; tasks: { title: string; status: string }[] }[]): string {
  const completed = milestones.filter((m) => m.status === "completed");
  const inProgress = milestones.filter((m) => m.status === "in_progress");
  const pending = milestones.filter((m) => m.status === "pending");

  const totalTasks = milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedTasks = milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.status === "completed").length,
    0
  );

  let summary = `Progress: ${completedTasks}/${totalTasks} tasks completed across ${milestones.length} milestones.\n`;

  if (completed.length > 0) {
    summary += `\nCompleted milestones:\n${completed.map((m) => `- ${m.title}`).join("\n")}`;
  }
  if (inProgress.length > 0) {
    summary += `\nIn-progress milestones:\n${inProgress.map((m) => {
      const done = m.tasks.filter((t) => t.status === "completed").length;
      return `- ${m.title} (${done}/${m.tasks.length} tasks done)`;
    }).join("\n")}`;
  }
  if (pending.length > 0) {
    summary += `\nPending milestones:\n${pending.map((m) => `- ${m.title}`).join("\n")}`;
  }

  return summary;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const userMessage = body.message as string;
  const phase = (body.phase as string) || "interview";

  const goal = await prisma.lifeGoal.findUnique({
    where: { id },
    include: {
      chatMessages: { orderBy: { createdAt: "asc" } },
      ...(phase === "adapt" && {
        milestones: {
          orderBy: { orderIndex: "asc" },
          include: { tasks: true },
        },
      }),
    },
  });
  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Save user message with phase
  await prisma.chatMessage.create({
    data: { lifeGoalId: id, role: "user", content: userMessage, phase },
  });

  // Build conversation history
  const messages: MessageParam[] = [
    ...goal.chatMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Select prompt based on phase
  const systemPrompt =
    phase === "adapt"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? getAdaptationInterviewPrompt(goal.title, buildProgressSummary((goal as any).milestones ?? []))
      : getInterviewPrompt(goal.title);

  // Call Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const assistantContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Save assistant response with phase
  const saved = await prisma.chatMessage.create({
    data: { lifeGoalId: id, role: "assistant", content: assistantContent, phase },
  });

  return Response.json({
    message: saved,
    readyToPlan: assistantContent.includes("[READY_TO_PLAN]"),
    readyToAdapt: assistantContent.includes("[READY_TO_ADAPT]"),
  });
}
