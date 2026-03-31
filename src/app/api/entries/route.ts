import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "day";
  const dateStr = searchParams.get("date") || new Date().toISOString();

  const date = new Date(dateStr);
  let start: Date;
  let end: Date;

  if (range === "day") {
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  } else if (range === "week") {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start = new Date(date.getFullYear(), date.getMonth(), diff);
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      startedAt: { gte: start, lt: end },
      stoppedAt: { not: null },
    },
    include: { category: true },
    orderBy: { startedAt: "desc" },
  });

  // Aggregate by category
  const summary: Record<
    string,
    { categoryId: string; name: string; color: string; icon: string; totalSeconds: number }
  > = {};

  for (const entry of entries) {
    const key = entry.categoryId;
    if (!summary[key]) {
      summary[key] = {
        categoryId: key,
        name: entry.category.name,
        color: entry.category.color,
        icon: entry.category.icon,
        totalSeconds: 0,
      };
    }
    summary[key].totalSeconds += entry.duration || 0;
  }

  return Response.json({
    entries,
    summary: Object.values(summary).sort((a, b) => b.totalSeconds - a.totalSeconds),
    range,
    start: start.toISOString(),
    end: end.toISOString(),
  });
}
