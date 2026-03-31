"use client";

import { useState, useEffect, useCallback } from "react";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Goal = {
  id: string;
  targetHours: number;
  period: string;
  category: Category;
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [targetHours, setTargetHours] = useState("1");
  const [period, setPeriod] = useState("daily");

  const fetchData = useCallback(async () => {
    const [goalsRes, catsRes] = await Promise.all([
      fetch("/api/goals"),
      fetch("/api/categories"),
    ]);
    setGoals(await goalsRes.json());
    const cats = await catsRes.json();
    setCategories(cats);
    if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        targetHours: parseFloat(targetHours),
        period,
      }),
    });
    setShowForm(false);
    setTargetHours("1");
    fetchData();
  }

  async function removeGoal(id: string) {
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const periodLabels: Record<string, string> = {
    daily: "per day",
    weekly: "per week",
    monthly: "per month",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Target Hours</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save Goal
          </button>
        </form>
      )}

      {/* Goals list */}
      <div className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
          >
            <span className="text-2xl">{goal.category.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{goal.category.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {goal.targetHours}h {periodLabels[goal.period]}
              </div>
            </div>
            <button
              onClick={() => removeGoal(goal.id)}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Remove goal"
            >
              ✕
            </button>
          </div>
        ))}

        {goals.length === 0 && !showForm && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">
            No goals set yet. Add one to start tracking your targets!
          </p>
        )}
      </div>
    </div>
  );
}
