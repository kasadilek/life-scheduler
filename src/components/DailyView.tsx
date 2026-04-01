"use client";

import { useState, useEffect, useCallback } from "react";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  estimatedMins: number | null;
  status: string;
  scheduledDate: string | null;
  milestone: {
    title: string;
    lifeGoal: { id: string; title: string };
  };
};

export default function DailyView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [date] = useState(() => new Date());

  const fetchTodaysTasks = useCallback(async () => {
    const res = await fetch("/api/life-goals");
    const goals = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allTasks: TaskItem[] = [];
    for (const goal of goals) {
      for (const milestone of goal.milestones || []) {
        for (const task of milestone.tasks || []) {
          if (task.scheduledDate) {
            const taskDate = new Date(task.scheduledDate);
            if (taskDate >= today && taskDate < tomorrow) {
              allTasks.push({
                ...task,
                milestone: { title: milestone.title, lifeGoal: { id: goal.id, title: goal.title } },
              });
            }
          }
        }
      }
    }
    setTasks(allTasks);
  }, []);

  useEffect(() => {
    fetchTodaysTasks();
  }, [fetchTodaysTasks]);

  async function toggleTask(goalId: string, taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await fetch(`/api/life-goals/${goalId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTodaysTasks();
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;

  const dayName = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-10 pt-4">
      {/* Hero */}
      <section>
        <span className="uppercase text-[10px] tracking-widest text-[#737686] font-bold mb-2 block">
          {dayName}
        </span>
        <h2 className="text-5xl font-extrabold tracking-tighter leading-tight mb-4">
          {totalCount === 0
            ? "Nothing scheduled today"
            : `${totalCount} step${totalCount !== 1 ? "s" : ""} to greatness today`}
        </h2>
      </section>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isDone = task.status === "completed";
            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  isDone ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTask(task.milestone.lifeGoal.id, task.id, task.status)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                      isDone
                        ? "bg-[#006c4a]"
                        : "border-2 border-[#c3c5d7] hover:border-[#003fb1]"
                    }`}
                  >
                    {isDone && (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold leading-tight mb-1 ${isDone ? "line-through" : ""}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-[#434654] text-sm leading-relaxed">{task.description}</p>
                    )}
                    <div className="flex gap-3 mt-3">
                      {task.estimatedMins && (
                        <span className="px-3 py-1 bg-[#ededf8] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#434654]">
                          {task.estimatedMins} mins
                        </span>
                      )}
                      <span className="px-3 py-1 bg-[#ededf8] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#434654]">
                        {task.milestone.lifeGoal.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Insight Card */}
      {tasks.length > 0 && (
        <div className="bg-[#7632e7] rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-3xl opacity-80">auto_awesome</span>
            <div>
              <p className="text-lg font-medium leading-tight">
                AI Insight: Focus on your most demanding task first while your energy is highest.
              </p>
              <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest mt-2 font-bold opacity-80">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% Complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {tasks.length > 0 && (
        <div className="bg-[#f3f3fe] rounded-xl p-8">
          <span className="uppercase text-[10px] tracking-widest text-[#737686] font-bold mb-3 block">
            Today&apos;s Momentum
          </span>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-extrabold text-[#003fb1]">
              {completedCount}/{totalCount}
            </span>
            <span className="text-[#434654] font-medium">Steps Completed</span>
          </div>
          <div className="h-4 w-full bg-[#e2e1ed] rounded-full overflow-hidden flex gap-1">
            {tasks.map((t, i) => (
              <div
                key={i}
                className={`flex-1 h-full ${
                  t.status === "completed" ? "bg-[#006c4a]" : "bg-[#e7e7f3]"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#f3f3fe] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#003fb1] text-4xl">
              event_available
            </span>
          </div>
          <p className="text-[#434654] max-w-sm mx-auto">
            No tasks scheduled for today. Create a goal and generate a plan to see your daily steps here.
          </p>
        </div>
      )}

      {/* Quote */}
      <div className="text-center italic text-[#434654]/50 max-w-lg mx-auto py-8">
        <p className="text-lg font-light leading-relaxed">
          &ldquo;The difference between who you are and who you want to be is what you do.&rdquo;
        </p>
      </div>
    </div>
  );
}
