"use client";

import { useState } from "react";

type Props = {
  onCreated: (goalId: string, title: string) => void;
  onCancel: () => void;
};

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
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        &larr; Back
      </button>

      <div className="text-center space-y-2">
        <div className="text-4xl">🎯</div>
        <h2 className="text-xl font-bold">What&apos;s your big goal?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Think big — we&apos;ll break it down together with AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Run a marathon, Learn Spanish, Build a SaaS..."
          className="w-full p-4 text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="w-full py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Start Planning with AI"}
        </button>
      </form>
    </div>
  );
}
