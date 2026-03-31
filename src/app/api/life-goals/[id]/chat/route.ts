import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { getInterviewPrompt } from "@/lib/prompts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const userMessage = body.message as string;

  // Get the goal
  const goal = await prisma.lifeGoal.findUnique({
    where: { id },
    include: { chatMessages: { orderBy: { createdAt: "asc" } } },
  });
  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { lifeGoalId: id, role: "user", content: userMessage },
  });

  // Build conversation history
  const messages: MessageParam[] = [
    ...goal.chatMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Call Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: getInterviewPrompt(goal.title),
    messages,
  });

  const assistantContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Save assistant response
  const saved = await prisma.chatMessage.create({
    data: { lifeGoalId: id, role: "assistant", content: assistantContent },
  });

  return Response.json({
    message: saved,
    readyToPlan: assistantContent.includes("[READY_TO_PLAN]"),
  });
}
