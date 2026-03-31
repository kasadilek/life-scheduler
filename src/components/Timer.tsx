"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDuration } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type ActiveTimer = {
  id: string;
  startedAt: string;
  category: Category;
};

export default function Timer({ onTimerChange }: { onTimerChange?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const fetchState = useCallback(async () => {
    const [catRes, timerRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/timer"),
    ]);
    setCategories(await catRes.json());
    const timer = await timerRes.json();
    setActive(timer);
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Tick the elapsed counter
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = new Date(active.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active]);

  async function startTimer(categoryId: string) {
    const res = await fetch("/api/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    setActive(await res.json());
    onTimerChange?.();
  }

  async function stopTimer() {
    await fetch("/api/timer", { method: "PATCH" });
    setActive(null);
    onTimerChange?.();
  }

  return (
    <div className="space-y-6">
      {/* Active timer display */}
      {active && (
        <div
          className="rounded-2xl p-6 text-white text-center space-y-3"
          style={{ backgroundColor: active.category.color }}
        >
          <div className="text-4xl">{active.category.icon}</div>
          <div className="text-lg font-medium">{active.category.name}</div>
          <div className="text-5xl font-mono font-bold tracking-tight">
            {formatDuration(elapsed)}
          </div>
          <button
            onClick={stopTimer}
            className="mt-3 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-medium transition-colors cursor-pointer"
          >
            ⏹ Stop
          </button>
        </div>
      )}

      {!active && (
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-1">No timer running</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Tap a category below to start</p>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => startTimer(cat.id)}
            className={`rounded-xl p-4 text-center transition-all hover:scale-105 cursor-pointer ${
              active?.category.id === cat.id
                ? "ring-2 ring-offset-2"
                : "hover:shadow-md"
            }`}
            style={{
              backgroundColor: cat.color + "18",
              borderColor: cat.color,
              ...(active?.category.id === cat.id
                ? { ringColor: cat.color }
                : {}),
            }}
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-sm font-medium" style={{ color: cat.color }}>
              {cat.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
