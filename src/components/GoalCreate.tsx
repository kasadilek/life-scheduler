"use client";

import { useState } from "react";

type Props = {
  onCreated: (goalId: string, title: string) => void;
  onCancel: () => void;
};

const suggestions = ["Run a Marathon", "AI Consultant", "Start a Business", "Write a Novel"];

export default function GoalCreate({ onCreated, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/life-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const goal = await res.json();
    onCreated(goal.id, title.trim());
  }

  return (
    <div className="space-y-12 pt-4">
      {/* Back */}
      <button
        onClick={onCancel}
        className="group flex items-center gap-2 text-[#434654] hover:text-[#003fb1] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="uppercase tracking-widest text-xs font-bold">
          Back to Goals
        </span>
      </button>

      {/* Editorial Hero */}
      <section>
        <span className="uppercase text-xs tracking-widest text-[#003fb1] font-bold mb-4 block">
          Manifestation Phase
        </span>
        <h1 className="text-5xl font-extrabold tracking-tighter leading-tight">
          What&apos;s your <span className="text-[#5d00cc]">dream?</span>
        </h1>
        <p className="mt-6 text-[#434654] text-lg max-w-xl leading-relaxed">
          We believe every grand achievement begins with a single, clear
          intention. Define your sanctuary&apos;s purpose.
        </p>
      </section>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="relative group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Run a Marathon"
            className="w-full bg-transparent border-0 border-b-2 border-[#c3c5d7] py-6 text-3xl font-medium focus:ring-0 focus:border-[#003fb1] transition-all duration-500 placeholder:text-[#d9d9e4] outline-none"
            autoFocus
            disabled={loading}
          />
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTitle(s)}
              className="px-6 py-3 rounded-full bg-[#f3f3fe] text-[#434654] font-medium hover:bg-[#e7e7f3] transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* AI Action Card */}
        <div className="bg-white rounded-[2rem] p-10 editorial-shadow relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">
              Structure the Unstructured
            </h3>
            <p className="text-[#434654] mb-8 leading-relaxed">
              Our kinetic engine will decompose your ambition into actionable
              milestones, habits, and resource requirements.
            </p>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="ai-gradient-purple text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-[#003fb1]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span>{loading ? "Analyzing..." : "Analyze with AI"}</span>
              <span className="material-symbols-outlined">auto_awesome</span>
            </button>
          </div>
          {/* Decorative glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#5d00cc]/10 rounded-full blur-[80px]" />
        </div>
      </form>
    </div>
  );
}
