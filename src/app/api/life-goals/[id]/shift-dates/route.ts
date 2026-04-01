import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const newStartDate = new Date(body.startDate);
  newStartDate.setHours(0, 0, 0, 0);

  const goal = await prisma.lifeGoal.findUnique({
    where: { id },
    include: {
      milestones: {
        include: { tasks: { orderBy: { orderIndex: "asc" } } },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Find the earliest scheduled task date
  let earliestDate: Date | null = null;
  for (const m of goal.milestones) {
    for (const t of m.tasks) {
      if (t.scheduledDate) {
        const d = new Date(t.scheduledDate);
        if (!earliestDate || d < earliestDate) earliestDate = d;
      }
    }
  }

  if (!earliestDate) {
    return Response.json({ error: "No scheduled tasks found" }, { status: 400 });
  }

  // Calculate offset in milliseconds
  const earliestMidnight = new Date(earliestDate);
  earliestMidnight.setHours(0, 0, 0, 0);
  const offsetMs = newStartDate.getTime() - earliestMidnight.getTime();

  if (offsetMs === 0) {
    return Response.json({ success: true, shifted: 0 });
  }

  // Shift all task dates
  for (const m of goal.milestones) {
    for (const t of m.tasks) {
      if (t.scheduledDate) {
        const newDate = new Date(new Date(t.scheduledDate).getTime() + offsetMs);
        await prisma.task.update({
          where: { id: t.id },
          data: { scheduledDate: newDate },
        });
      }
    }

    // Shift milestone target date
    if (m.targetDate) {
      const newTarget = new Date(new Date(m.targetDate).getTime() + offsetMs);
      await prisma.milestone.update({
        where: { id: m.id },
        data: { targetDate: newTarget },
      });
    }
  }

  // Shift goal target date
  if (goal.targetDate) {
    const newGoalTarget = new Date(new Date(goal.targetDate).getTime() + offsetMs);
    await prisma.lifeGoal.update({
      where: { id },
      data: { targetDate: newGoalTarget },
    });
  }

  return Response.json({ success: true, offsetDays: Math.round(offsetMs / (24 * 60 * 60 * 1000)) });
}
