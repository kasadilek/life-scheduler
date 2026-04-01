import { prisma } from "@/lib/db";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      scheduledDate: { gte: today, lt: tomorrow },
    },
    include: {
      milestone: {
        select: {
          title: true,
          lifeGoal: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { startHour: "asc" },
  });

  return Response.json(tasks);
}
