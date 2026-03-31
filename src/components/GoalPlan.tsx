"use client";

import { useState, useEffect, useCallback } from "react";

type TaskType = {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  estimatedMins: number | null;
  status: string;
};

type MilestoneType = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  tasks: TaskType[];
};

type GoalType = {
  id: string;
  title: string;
  planSummary: string | null;
  targetDate: string | null;
  status: string;
  milestones: MilestoneType[];
};

type Props = {
  goalId: string;
  onBack: () => void;
};

export default function GoalPlan({ goalId, onBack }: Props) {
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    const res = await fetch(`/api/life-goals/${goalId}`);
    const data = await res.json();
    setGoal(data);
    setExpandedMilestone((prev) => {
      if (prev) return prev;
      const first = data.milestones?.find(
        (m: MilestoneType) => m.status !== "completed"
      );
      return first?.id ?? null;
    });
  }, [goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await fetch(`/api/life-goals/${goalId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchGoal();
  }

  if (!goal) {
    return <div className="text-center py-8 text-gray-400">Loading plan...</div>;
  }

  const totalTasks = goal.milestones.reduce(
    (sum, m) => sum + m.tasks.length,
    0
  );
  const completedTasks = goal.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.status === "completed").length,
    0
  );
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const frequencyBadge: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    once: "One-time",
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        &larr; Back to goals
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">{goal.title}</h2>
        {goal.targetDate && (
          <p className="text-sm text-gray-500">
            Target: {new Date(goal.targetDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">
            {completedTasks}/{totalTasks} tasks ({Math.round(progress)}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Plan summary */}
      {goal.planSummary && (
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
          {goal.planSummary}
        </p>
      )}

      {/* Milestones */}
      <div className="space-y-3">
        {goal.milestones.map((milestone, idx) => {
          const isExpanded = expandedMilestone === milestone.id;
          const milestoneDone = milestone.status === "completed";
          const milestoneTasksDone = milestone.tasks.filter(
            (t) => t.status === "completed"
          ).length;

          return (
            <div
              key={milestone.id}
              className={`rounded-xl border transition-colors ${
                milestoneDone
                  ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20"
                  : "border-gray-100 dark:border-gray-800"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedMilestone(isExpanded ? null : milestone.id)
                }
                className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    milestoneDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {milestoneDone ? "✓" : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{milestone.title}</div>
                  <div className="text-xs text-gray-400">
                    {milestoneTasksDone}/{milestone.tasks.length} tasks
                    {milestone.targetDate &&
                      ` · by ${new Date(milestone.targetDate).toLocaleDateString()}`}
                  </div>
                </div>
                <span className="text-gray-400 text-sm">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {milestone.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {milestone.description}
                    </p>
                  )}
                  {milestone.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <button
                        onClick={() => toggleTask(task.id, task.status)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                          task.status === "completed"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                        }`}
                      >
                        {task.status === "completed" && (
                          <span className="text-xs">✓</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            task.status === "completed"
                              ? "line-through text-gray-400"
                              : ""
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          {task.frequency && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              {frequencyBadge[task.frequency] || task.frequency}
                            </span>
                          )}
                          {task.estimatedMins && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                              {task.estimatedMins}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
