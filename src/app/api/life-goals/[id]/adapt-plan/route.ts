import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { getAdaptivePlanGenerationPrompt } from "@/lib/prompts";
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
    include: {
      chatMessages: { orderBy: { createdAt: "asc" } },
      milestones: {
        orderBy: { orderIndex: "asc" },
        include: { tasks: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });
  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Partition milestones: preserve those with any completed tasks
  const preservedMilestones = goal.milestones.filter((m) =>
    m.tasks.some((t) => t.status === "completed")
  );
  const pendingMilestones = goal.milestones.filter(
    (m) => !m.tasks.some((t) => t.status === "completed")
  );

  // Build completed work description for the AI
  let completedWork = "";
  if (preservedMilestones.length > 0) {
    completedWork = "The user has already completed the following work (DO NOT regenerate these):\n";
    for (const m of preservedMilestones) {
      const doneTasks = m.tasks.filter((t) => t.status === "completed");
      completedWork += `\nMilestone: "${m.title}"\nCompleted tasks:\n`;
      completedWork += doneTasks.map((t) => `- ${t.title}`).join("\n");
    }
    completedWork += "\n\nGenerate ONLY new milestones for the remaining/adapted work.";
  } else {
    completedWork = "The user has not completed any tasks yet. Generate a complete fresh plan incorporating the new aspects they described.";
  }

  // Delete pending milestones (cascade deletes their tasks)
  if (pendingMilestones.length > 0) {
    await prisma.milestone.deleteMany({
      where: { id: { in: pendingMilestones.map((m) => m.id) } },
    });
  }

  // Also delete pending tasks from preserved milestones (they'll be replaced)
  if (preservedMilestones.length > 0) {
    await prisma.task.deleteMany({
      where: {
        milestoneId: { in: preservedMilestones.map((m) => m.id) },
        status: "pending",
      },
    });
  }

  // Build message history from all chat phases
  const messages: MessageParam[] = goal.chatMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  messages.push({
    role: "user",
    content: "Please generate my adapted structured plan now.",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: getAdaptivePlanGenerationPrompt(goal.title, completedWork),
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

  // Calculate start date: day after last completed task, or today
  const lastCompletedDate = preservedMilestones
    .flatMap((m) => m.tasks)
    .filter((t) => t.status === "completed" && t.scheduledDate)
    .map((t) => new Date(t.scheduledDate!))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const planStartDate = lastCompletedDate
    ? new Date(lastCompletedDate.getTime() + 24 * 60 * 60 * 1000)
    : new Date();
  planStartDate.setHours(0, 0, 0, 0);

  // orderIndex continues from preserved milestones
  const startOrderIndex = preservedMilestones.length;

  // Create new milestones and tasks
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
          orderIndex: startOrderIndex + i,
          targetDate,
          tasks: {
            create: m.tasks.map((t, j) => {
              const scheduledDate = new Date(
                planStartDate.getTime() +
                  (t.dayNumber - 1) * 24 * 60 * 60 * 1000
              );
              scheduledDate.setHours(t.startHour || 8, 0, 0, 0);
              return {
                title: t.title,
                description: t.description,
                scheduledDate,
                startHour: t.startHour || 8,
                estimatedMins: t.estimatedMinutes,
                learningObjectives: t.learningObjectives
                  ? JSON.stringify(t.learningObjectives)
                  : null,
                resources: t.resources
                  ? JSON.stringify(t.resources)
                  : null,
                orderIndex: j,
              };
            }),
          },
        },
      });
    })
  );

  // Update goal: restore previous status, update summary and target date
  const lastMilestone = plan.milestones[plan.milestones.length - 1];
  const goalTargetDate = lastMilestone
    ? new Date(
        planStartDate.getTime() +
          lastMilestone.endWeek * 7 * 24 * 60 * 60 * 1000
      )
    : goal.targetDate;

  await prisma.lifeGoal.update({
    where: { id },
    data: {
      status: goal.previousStatus || "planned",
      previousStatus: null,
      planSummary: plan.summary,
      targetDate: goalTargetDate,
    },
  });

  return Response.json({ success: true, goalId: id });
}
