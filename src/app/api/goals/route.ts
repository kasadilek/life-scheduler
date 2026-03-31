import { prisma } from "@/lib/db";

export async function GET() {
  const goals = await prisma.goal.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(goals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const goal = await prisma.goal.create({
    data: {
      categoryId: body.categoryId,
      targetHours: body.targetHours,
      period: body.period,
    },
    include: { category: true },
  });
  return Response.json(goal, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  await prisma.goal.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ success: true });
}
