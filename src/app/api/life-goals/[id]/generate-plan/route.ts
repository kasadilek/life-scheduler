import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { getPlanGenerationPrompt } from "@/lib/prompts";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

type PlanResource = {
  title: string;
  url: string;
  type: string;
  durationMins?: number;
};

type PlanTask = {
  title: string;
  description: string;
  dayNumber: number;
  startHour: number;
  estimatedMinutes: number;
  learningObjectives?: string[];
  resources?: PlanResource[];
};

type PlanMilestone = {
  title: string;
  description: string;
  startWeek: number;
  endWeek: number;
  tasks: PlanTask[];
};

type PlanResponse = {
  summary: string;
  totalWeeks: number;
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

  const messages: MessageParam[] = goal.chatMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  messages.push({
    role: "user",
    content: "Please generate my structured plan now.",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: getPlanGenerationPrompt(goal.title),
    messages,
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

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

  const planStartDate = new Date();
  planStartDate.setHours(0, 0, 0, 0);

  await Promise.all(
    plan.milestones.map((m, i) => {
      const targetDate = new Date(
        planStartDate.getTime() + m.endWeek * 7 * 24 * 60 * 60 * 1000
      );
      return prisma.milestone.create({
        data: {
          lifeGoalId: id,
          title: m.title,
          description: m.description,
          orderIndex: i,
          targetDate,
          tasks: {
            create: m.tasks.map((t, j) => {
              const scheduledDate = new Date(
                planStartDate.getTime() + (t.dayNumber - 1) * 24 * 60 * 60 * 1000
              );
              scheduledDate.setHours(t.startHour || 8, 0, 0, 0);
              return {
                title: t.title,
                description: t.description,
                scheduledDate,
                startHour: t.startHour || 8,
                estimatedMins: t.estimatedMinutes,
                learningObjectives: t.learningObjectives ? JSON.stringify(t.learningObjectives) : null,
                resources: t.resources ? JSON.stringify(t.resources) : null,
                orderIndex: j,
              };
            }),
          },
        },
      });
    })
  );

  const goalTargetDate = new Date(
    planStartDate.getTime() + plan.totalWeeks * 7 * 24 * 60 * 60 * 1000
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
