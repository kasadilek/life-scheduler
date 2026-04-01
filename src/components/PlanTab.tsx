"use client";

import { useState, useEffect, useCallback } from "react";
import GoalPlan from "./GoalPlan";

type GoalSummary = {
  id: string;
  title: string;
  status: string;
  planSummary: string | null;
  milestones: { tasks: { status: string }[] }[];
};

export default function PlanTab() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/life-goals");
    const data: GoalSummary[] = await res.json();
    const withPlan = data.filter((g) => g.status === "planned" || g.status === "active");
    setGoals(withPlan);
    if (withPlan.length > 0 && !selectedGoalId) {
      setSelectedGoalId(withPlan[0].id);
    }
  }, [selectedGoalId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  if (selectedGoalId) {
    return (
      <GoalPlan
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
      />
    );
  }

  // Show plan selector if multiple goals have plans
  return (
    <div className="space-y-10 pt-4">
      <section>
        <span className="uppercase text-[10px] tracking-widest text-[#003fb1] font-bold block mb-2">
          Strategy Overview
        </span>
        <h2 className="text-5xl font-extrabold tracking-tighter leading-tight">
          Your Active Plans
        </h2>
      </section>

      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const total = goal.milestones.reduce((s, m) => s + m.tasks.length, 0);
            const done = goal.milestones.reduce(
              (s, m) => s + m.tasks.filter((t) => t.status === "completed").length,
              0
            );
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className="bg-white rounded-xl p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{goal.title}</h3>
                    {goal.planSummary && (
                      <p className="text-[#434654] text-sm mt-1 line-clamp-1">{goal.planSummary}</p>
                    )}
                  </div>
                  <span className="text-2xl font-extrabold text-[#003fb1]">{pct}%</span>
                </div>
                <div className="h-2 w-full bg-[#e2e1ed] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c4a] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-[#434654] uppercase tracking-wider">
                  <span>{done}/{total} tasks</span>
                  <span className={goal.status === "active" ? "text-[#006c4a]" : "text-[#003fb1]"}>
                    {goal.status === "active" ? "Active" : "Ready to start"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#f3f3fe] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#003fb1] text-4xl">psychology</span>
          </div>
          <h3 className="text-2xl font-bold">No plans yet</h3>
          <p className="text-[#434654] max-w-sm mx-auto">
            Create a goal and complete the AI interview to generate your first plan.
          </p>
        </div>
      )}
    </div>
  );
}
