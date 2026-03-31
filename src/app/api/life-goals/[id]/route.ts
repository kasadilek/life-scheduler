import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const goal = await prisma.lifeGoal.findUnique({
    where: { id },
    include: {
      chatMessages: { orderBy: { createdAt: "asc" } },
      milestones: {
        include: { tasks: { orderBy: { orderIndex: "asc" } } },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!goal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(goal);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const goal = await prisma.lifeGoal.update({
    where: { id },
    data: body,
  });
  return Response.json(goal);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lifeGoal.delete({ where: { id } });
  return Response.json({ success: true });
}
