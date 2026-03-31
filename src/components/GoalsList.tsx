"use client";

import { useState, useEffect, useCallback } from "react";

type GoalSummary = {
  id: string;
  title: string;
  status: string;
  targetDate: string | null;
  milestones: {
    tasks: { status: string }[];
  }[];
};

type Props = {
  onNewGoal: () => void;
  onSelectGoal: (goalId: string, title: string, status: string) => void;
};

export default function GoalsList({ onNewGoal, onSelectGoal }: Props) {
  const [goals, setGoals] = useState<GoalSummary[]>([]);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/life-goals");
    setGoals(await res.json());
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    drafting: { label: "In Interview", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    planned: { label: "Planned", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    active: { label: "Active", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    completed: { label: "Done", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  };

  function getProgress(goal: GoalSummary) {
    const total = goal.milestones.reduce((s, m) => s + m.tasks.length, 0);
    const done = goal.milestones.reduce(
      (s, m) => s + m.tasks.filter((t) => t.status === "completed").length,
      0
    );
    return { total, done, pct: total > 0 ? (done / total) * 100 : 0 };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Goals</h2>
        <button
          onClick={onNewGoal}
          className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          + New Goal
        </button>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const status = statusConfig[goal.status] || statusConfig.drafting;
          const progress = getProgress(goal);

          return (
            <button
              key={goal.id}
              onClick={() => onSelectGoal(goal.id, goal.title, goal.status)}
              className="w-full p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{goal.title}</div>
                  {goal.targetDate && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${status.color}`}
                >
                  {status.label}
                </span>
              </div>

              {progress.total > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${progress.pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {progress.done}/{progress.total} tasks
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">🎯</div>
            <p className="text-gray-500 dark:text-gray-400">
              No goals yet. Set your first big goal!
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              AI will interview you and create a personalized plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
