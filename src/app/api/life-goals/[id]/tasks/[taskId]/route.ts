import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: body.status,
      completedAt: body.status === "completed" ? new Date() : null,
    },
  });

  // Update milestone status based on sibling task statuses
  const siblingTasks = await prisma.task.findMany({
    where: { milestoneId: task.milestoneId },
    select: { id: true, status: true },
  });

  const allDone = siblingTasks.every((t) =>
    t.id === taskId ? body.status === "completed" : t.status === "completed"
  );

  await prisma.milestone.update({
    where: { id: task.milestoneId },
    data: { status: allDone ? "completed" : "in_progress" },
  });

  return Response.json(task);
}
