"use client";

import { useState, useEffect, useCallback } from "react";

type GoalProgress = {
  id: string;
  title: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  pct: number;
  milestones: {
    title: string;
    status: string;
    completedAt?: string;
  }[];
};

export default function ProgressView() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    const res = await fetch("/api/life-goals");
    const data = await res.json();

    const processed: GoalProgress[] = data.map(
      (g: {
        id: string;
        title: string;
        status: string;
        milestones: { title: string; status: string; tasks: { status: string }[] }[];
      }) => {
        const totalTasks = g.milestones.reduce((s: number, m: { tasks: { status: string }[] }) => s + m.tasks.length, 0);
        const completedTasks = g.milestones.reduce(
          (s: number, m: { tasks: { status: string }[] }) => s + m.tasks.filter((t: { status: string }) => t.status === "completed").length,
          0
        );
        return {
          id: g.id,
          title: g.title,
          status: g.status,
          totalTasks,
          completedTasks,
          pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          milestones: g.milestones.map((m: { title: string; status: string }) => ({
            title: m.title,
            status: m.status,
          })),
        };
      }
    );
    setGoals(processed);
    setSelectedGoal((prev) => {
      if (prev) return prev;
      return processed.length > 0 ? processed[0].id : null;
    });
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const active = goals.find((g) => g.id === selectedGoal);

  return (
    <div className="space-y-10 pt-4">
      {/* Hero */}
      <section>
        <span className="uppercase text-[10px] tracking-widest text-[#5d00cc] font-bold mb-2 block">
          Current Journey
        </span>
        <h2 className="text-5xl font-extrabold tracking-tight leading-tight">
          {active?.title || "Your Progress"}
        </h2>
      </section>

      {/* Goal Selector */}
      {goals.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGoal(g.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedGoal === g.id
                  ? "bg-[#003fb1] text-white"
                  : "bg-[#f3f3fe] text-[#434654] hover:bg-[#e7e7f3]"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Circular Progress */}
          <div className="md:col-span-7 bg-[#f3f3fe] rounded-xl p-8 flex flex-col items-center justify-center">
            <div
              className="relative w-56 h-56 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(closest-side, #f3f3fe 79%, transparent 80% 100%), conic-gradient(#003fb1 ${active.pct}%, #e2e1ed 0)`,
              }}
            >
              <div className="text-center">
                <span className="block text-5xl font-extrabold text-[#003fb1] -tracking-widest">
                  {active.pct}%
                </span>
                <span className="uppercase text-[10px] tracking-widest text-[#434654]">
                  Completed
                </span>
              </div>
            </div>
            <div className="mt-10 text-center">
              <h3 className="text-xl font-bold mb-2">
                {active.pct >= 50 ? "Halfway to the Horizon" : "Building Momentum"}
              </h3>
              <p className="text-[#434654] text-sm max-w-xs mx-auto">
                {active.completedTasks} of {active.totalTasks} tasks completed.
                {active.totalTasks - active.completedTasks > 0 &&
                  ` ${active.totalTasks - active.completedTasks} steps remaining.`}
              </p>
            </div>
          </div>

          {/* Milestones */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg">Milestones</h4>
                <span
                  className="material-symbols-outlined text-[#006c4a]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
              </div>
              <ul className="space-y-4">
                {active.milestones.map((m, i) => {
                  const isDone = m.status === "completed";
                  const isLocked = !isDone && i > 0 && active.milestones[i - 1].status !== "completed";
                  return (
                    <li key={i} className={`flex items-start gap-4 ${isLocked ? "opacity-40" : ""}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDone ? "bg-[#85f8c4]" : "bg-[#e2e1ed]"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-sm ${isDone ? "text-[#005137]" : "text-[#434654]"}`}>
                          {isDone ? "check" : isLocked ? "lock" : "radio_button_unchecked"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{m.title}</p>
                        <p className="text-xs text-[#434654]">
                          {isDone ? "Achieved" : isLocked ? "Locked" : "In progress"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* AI Insight */}
            <div className="bg-[#003fb1] text-white rounded-xl p-6 hover:-translate-y-1 transition-transform duration-300">
              <span className="uppercase text-[10px] tracking-widest opacity-70 block mb-2">
                Daily Insight
              </span>
              <p className="text-lg font-medium leading-tight mb-4">
                &ldquo;Structure is the scaffolding of creative freedom.&rdquo;
              </p>
              <div className="flex items-center gap-2 opacity-80">
                <span className="material-symbols-outlined">psychology</span>
                <span className="text-xs font-semibold">AI Curated Focus</span>
              </div>
            </div>
          </div>

          {/* Task Composition */}
          <div className="md:col-span-12 mt-4">
            <h4 className="text-2xl font-bold mb-6">Task Composition</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#f3f3fe] p-6 rounded-xl">
                <p className="uppercase text-[10px] tracking-widest text-[#434654] mb-4">Total</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold">{active.totalTasks}</span>
                  <span className="text-[#434654] text-sm mb-1">Actions</span>
                </div>
                <div className="w-full bg-[#e2e1ed] h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-[#003fb1] h-full w-full rounded-full" />
                </div>
              </div>
              <div className="bg-[#f3f3fe] p-6 rounded-xl border-l-4 border-[#006c4a]">
                <p className="uppercase text-[10px] tracking-widest text-[#006c4a] mb-4">Completed</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold">{active.completedTasks}</span>
                  <span className="text-[#434654] text-sm mb-1">Actions</span>
                </div>
                <div className="w-full bg-[#e2e1ed] h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-[#006c4a] h-full rounded-full" style={{ width: `${active.pct}%` }} />
                </div>
              </div>
              <div className="bg-[#f3f3fe] p-6 rounded-xl border-l-4 border-[#5d00cc]">
                <p className="uppercase text-[10px] tracking-widest text-[#5d00cc] mb-4">Remaining</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold">{active.totalTasks - active.completedTasks}</span>
                  <span className="text-[#434654] text-sm mb-1">Actions</span>
                </div>
                <div className="w-full bg-[#e2e1ed] h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-[#5d00cc] h-full rounded-full" style={{ width: `${100 - active.pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Card */}
          <div className="md:col-span-12 mt-8 mb-8 bg-[#85f8c4] p-10 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#006c4a] opacity-10 rounded-full blur-3xl" />
            <div className="relative flex-shrink-0 w-28 h-28 bg-white/40 rounded-full flex items-center justify-center glass-nav">
              <span
                className="material-symbols-outlined text-5xl text-[#006c4a]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <div className="text-center md:text-left z-10">
              <h3 className="text-3xl font-extrabold text-[#002114] leading-tight">
                Arrival is Inevitable.
              </h3>
              <p className="text-[#005137] mt-2 max-w-md">
                Once you reach 100%, your Sanctuary becomes an immutable part of your lifestyle.
                You are {active.totalTasks - active.completedTasks} steps away from mastery.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#f3f3fe] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[#003fb1] text-4xl">monitoring</span>
          </div>
          <h3 className="text-2xl font-bold">No progress yet</h3>
          <p className="text-[#434654] max-w-sm mx-auto">
            Create a goal and start working through your plan to see progress here.
          </p>
        </div>
      )}
    </div>
  );
}
