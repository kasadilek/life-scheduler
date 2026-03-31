import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { getPlanGenerationPrompt } from "@/lib/prompts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

type PlanTask = {
  title: string;
  description: string;
  frequency: string;
  estimatedMinutes: number;
};

type PlanMilestone = {
  title: string;
  description: string;
  targetWeek: number;
  tasks: PlanTask[];
};

type PlanResponse = {
  summary: string;
  totalWeeks: number;
  weeklyHours: number;
  milestones: PlanMilestone[];
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const goal = await prisma.lifeGoal.findUnique({
    where: { id },
    include: { chatMessages: { orderBy: { createdAt: "asc" } } },
  });
  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Build conversation for context
  const messages: MessageParam[] = goal.chatMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Add a final user message requesting the plan
  messages.push({
    role: "user",
    content: "Please generate my structured plan now.",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: getPlanGenerationPrompt(goal.title),
    messages,
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown fences if present
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let plan: PlanResponse;
  try {
    plan = JSON.parse(jsonText);
  } catch {
    return Response.json(
      { error: "Failed to parse AI plan", raw: rawText },
      { status: 500 }
    );
  }

  // Calculate target dates from weeks
  const now = new Date();

  // Create milestones and tasks in parallel
  await Promise.all(
    plan.milestones.map((m, i) => {
      const targetDate = new Date(
        now.getTime() + m.targetWeek * 7 * 24 * 60 * 60 * 1000
      );
      return prisma.milestone.create({
        data: {
          lifeGoalId: id,
          title: m.title,
          description: m.description,
          orderIndex: i,
          targetDate,
          tasks: {
            create: m.tasks.map((t, j) => ({
              title: t.title,
              description: t.description,
              frequency: t.frequency,
              estimatedMins: t.estimatedMinutes,
              orderIndex: j,
            })),
          },
        },
      });
    })
  );

  // Update goal status and summary
  const goalTargetDate = new Date(
    now.getTime() + plan.totalWeeks * 7 * 24 * 60 * 60 * 1000
  );
  await prisma.lifeGoal.update({
    where: { id },
    data: {
      status: "planned",
      planSummary: plan.summary,
      targetDate: goalTargetDate,
    },
  });

  return Response.json({ success: true, goalId: id });
}
