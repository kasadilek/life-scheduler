import { prisma } from "@/lib/db";

// GET active timer (if any)
export async function GET() {
  const active = await prisma.timeEntry.findFirst({
    where: { stoppedAt: null },
    include: { category: true },
    orderBy: { startedAt: "desc" },
  });
  return Response.json(active);
}

// POST start a new timer
export async function POST(request: Request) {
  const body = await request.json();

  // Stop any currently running timer first
  const active = await prisma.timeEntry.findFirst({
    where: { stoppedAt: null },
  });
  if (active) {
    const duration = Math.floor(
      (Date.now() - active.startedAt.getTime()) / 1000
    );
    await prisma.timeEntry.update({
      where: { id: active.id },
      data: { stoppedAt: new Date(), duration },
    });
  }

  const entry = await prisma.timeEntry.create({
    data: {
      categoryId: body.categoryId,
      note: body.note || null,
    },
    include: { category: true },
  });
  return Response.json(entry, { status: 201 });
}

// PATCH stop the current timer
export async function PATCH() {
  const active = await prisma.timeEntry.findFirst({
    where: { stoppedAt: null },
  });
  if (!active) {
    return Response.json({ error: "No active timer" }, { status: 404 });
  }

  const duration = Math.floor(
    (Date.now() - active.startedAt.getTime()) / 1000
  );
  const entry = await prisma.timeEntry.update({
    where: { id: active.id },
    data: { stoppedAt: new Date(), duration },
    include: { category: true },
  });
  return Response.json(entry);
}
