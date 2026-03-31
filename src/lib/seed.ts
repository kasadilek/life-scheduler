import { prisma } from "./db";

const defaultCategories = [
  { name: "Work", color: "#3B82F6", icon: "💼" },
  { name: "Coding", color: "#8B5CF6", icon: "💻" },
  { name: "Exercise", color: "#10B981", icon: "🏋️" },
  { name: "Reading", color: "#F59E0B", icon: "📚" },
  { name: "Sleep", color: "#6366F1", icon: "😴" },
  { name: "Social", color: "#EC4899", icon: "👥" },
  { name: "Learning", color: "#14B8A6", icon: "🎓" },
  { name: "Break", color: "#9CA3AF", icon: "☕" },
];

export async function seedCategories() {
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({ data: defaultCategories });
  }
}
