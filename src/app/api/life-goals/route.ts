import { prisma } from "@/lib/db";

export async function GET() {
  const goals = await prisma.lifeGoal.findMany({
    include: {
      milestones: {
        select: {
          title: true,
          status: true,
          tasks: { select: { status: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(goals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const goal = await prisma.lifeGoal.create({
    data: {
      title: body.title,
      description: body.description || null,
    },
  });
  return Response.json(goal, { status: 201 });
}
