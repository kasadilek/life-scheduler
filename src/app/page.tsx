"use client";

import { useState } from "react";
import Timer from "@/components/Timer";
import Dashboard from "@/components/Dashboard";
import Goals from "@/components/Goals";

type Tab = "timer" | "dashboard" | "goals";

export default function Home() {
  const [tab, setTab] = useState<Tab>("timer");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "timer", label: "Timer", icon: "⏱" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "goals", label: "Goals", icon: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <h1 className="text-xl font-bold text-center">Life Scheduler</h1>
      </header>

      {/* Tab navigation */}
      <nav className="flex border-b border-gray-100 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4">
        {tab === "timer" && (
          <Timer onTimerChange={() => setRefreshKey((k) => k + 1)} />
        )}
        {tab === "dashboard" && <Dashboard refreshKey={refreshKey} />}
        {tab === "goals" && <Goals />}
      </main>
    </div>
  );
}
