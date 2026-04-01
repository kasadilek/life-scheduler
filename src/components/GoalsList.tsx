"use client";

import { useState, useEffect, useCallback } from "react";

type GoalSummary = {
  id: string;
  title: string;
  status: string;
  targetDate: string | null;
  planSummary: string | null;
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

  async function deleteGoal(e: React.MouseEvent, goalId: string) {
    e.stopPropagation();
    if (!confirm("Delete this goal and all its tasks?")) return;
    await fetch(`/api/life-goals/${goalId}`, { method: "DELETE" });
    fetchGoals();
  }

  function getProgress(goal: GoalSummary) {
    const total = goal.milestones.reduce((s, m) => s + m.tasks.length, 0);
    const done = goal.milestones.reduce(
      (s, m) => s + m.tasks.filter((t) => t.status === "completed").length,
      0
    );
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  const statusLabels: Record<string, string> = {
    drafting: "In Progress",
    planned: "Ready",
    active: "Active",
    completed: "Achieved",
  };

  return (
    <div className="space-y-12">
      {/* Editorial Hero */}
      <section>
        <span className="uppercase text-xs tracking-widest text-[#003fb1] font-bold mb-4 block">
          Personal Architecture
        </span>
        <h2 className="text-5xl font-extrabold tracking-tighter leading-[1.1] max-w-lg">
          Your focus is the{" "}
          <span className="text-[#1a56db] italic">sanctuary</span> of your
          progress.
        </h2>
      </section>

      {/* Add Goal CTA */}
      <button
        onClick={onNewGoal}
        className="group flex items-center gap-3 ai-gradient text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-[#003fb1]/20 hover:-translate-y-1 transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined">add</span>
        <span className="tracking-tight">Add New Goal</span>
      </button>

      {/* Goals Grid */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {goals.map((goal, idx) => {
            const progress = getProgress(goal);
            const isLarge = idx === 0;
            const isCompleted = goal.status === "completed";

            if (isCompleted) {
              return (
                <div
                  key={goal.id}
                  onClick={() => onSelectGoal(goal.id, goal.title, goal.status)}
                  className="md:col-span-12 bg-[#85f8c4] rounded-[2rem] p-8 flex items-center justify-between cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/40 glass-nav flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-[#00714e] text-3xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-[#002114] tracking-tight">
                        {goal.title}
                      </h3>
                      <p className="text-[#005137] font-medium">Goal Achieved</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteGoal(e, goal.id)}
                    className="text-[#005137]/40 hover:text-[#ba1a1a] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              );
            }

            return (
              <div
                key={goal.id}
                onClick={() => onSelectGoal(goal.id, goal.title, goal.status)}
                className={`${
                  isLarge ? "md:col-span-8" : "md:col-span-4"
                } bg-white rounded-[2rem] ${
                  isLarge ? "p-10" : "p-8"
                } flex flex-col justify-between min-h-[280px] cursor-pointer hover:-translate-y-1 transition-transform duration-300`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        goal.status === "active"
                          ? "bg-[#006c4a]/10 text-[#006c4a]"
                          : goal.status === "planned"
                          ? "bg-[#003fb1]/10 text-[#003fb1]"
                          : "bg-[#5d00cc]/10 text-[#5d00cc]"
                      }`}
                    >
                      {statusLabels[goal.status] || goal.status}
                    </span>
                    <button
                      onClick={(e) => deleteGoal(e, goal.id)}
                      className="text-[#c3c5d7] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">
                        close
                      </span>
                    </button>
                  </div>
                  <h3
                    className={`${
                      isLarge ? "text-3xl" : "text-xl"
                    } font-extrabold tracking-tight mb-3 text-[#191b23]`}
                  >
                    {goal.title}
                  </h3>
                  {goal.planSummary && (
                    <p className="text-[#434654] text-sm leading-relaxed line-clamp-2 max-w-md">
                      {goal.planSummary}
                    </p>
                  )}
                </div>

                {progress.total > 0 && (
                  <div className="mt-8">
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-bold text-xl">{progress.pct}%</span>
                      <span className="uppercase text-[10px] tracking-widest text-[#434654] font-bold">
                        {progress.done} / {progress.total} Tasks
                      </span>
                    </div>
                    <div className="h-3 w-full bg-[#e2e1ed] rounded-full flex gap-0.5 overflow-hidden">
                      <div
                        className="h-full bg-[#006c4a] rounded-full transition-all duration-500"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {progress.total === 0 && goal.targetDate && (
                  <div className="mt-8 text-sm text-[#434654]">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#dbe1ff] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#003fb1] text-4xl">
              flag
            </span>
          </div>
          <h3 className="text-2xl font-bold">Define your sanctuary</h3>
          <p className="text-[#434654] max-w-sm mx-auto">
            Every grand achievement begins with a single, clear intention.
          </p>
        </div>
      )}
    </div>
  );
}
