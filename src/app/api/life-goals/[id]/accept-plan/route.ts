import { prisma } from "@/lib/db";
import { addPlanToCalendar } from "@/lib/calendar";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  if (goal.status !== "planned") {
    return Response.json(
      { error: "Plan must be in 'planned' status to accept" },
      { status: 400 }
    );
  }

  try {
    const eventCount = await addPlanToCalendar(goal);

    await prisma.lifeGoal.update({
      where: { id },
      data: { status: "active" },
    });

    return Response.json({ success: true, eventCount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add to calendar";
    return Response.json({ error: message }, { status: 500 });
  }
}
