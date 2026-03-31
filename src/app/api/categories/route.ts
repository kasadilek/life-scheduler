import { prisma } from "@/lib/db";
import { seedCategories } from "@/lib/seed";

export async function GET() {
  await seedCategories();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const category = await prisma.category.create({
    data: {
      name: body.name,
      color: body.color,
      icon: body.icon,
    },
  });
  return Response.json(category, { status: 201 });
}
