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
        include: { tasks: { select: { id: true, scheduledDate: true } } },
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

  const earliestMidnight = new Date(earliestDate);
  earliestMidnight.setHours(0, 0, 0, 0);
  const offsetMs = newStartDate.getTime() - earliestMidnight.getTime();

  if (offsetMs === 0) {
    return Response.json({ success: true, shifted: 0 });
  }

  // Batch all updates into a single Promise.all
  const updates: Promise<unknown>[] = [];

  for (const m of goal.milestones) {
    for (const t of m.tasks) {
      if (t.scheduledDate) {
        updates.push(
          prisma.task.update({
            where: { id: t.id },
            data: { scheduledDate: new Date(new Date(t.scheduledDate).getTime() + offsetMs) },
          })
        );
      }
    }
    if (m.targetDate) {
      updates.push(
        prisma.milestone.update({
          where: { id: m.id },
          data: { targetDate: new Date(new Date(m.targetDate).getTime() + offsetMs) },
        })
      );
    }
  }

  if (goal.targetDate) {
    updates.push(
      prisma.lifeGoal.update({
        where: { id },
        data: { targetDate: new Date(new Date(goal.targetDate).getTime() + offsetMs) },
      })
    );
  }

  await Promise.all(updates);

  return Response.json({ success: true, offsetDays: Math.round(offsetMs / (24 * 60 * 60 * 1000)) });
}
