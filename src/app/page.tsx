"use client";

import { useState } from "react";
import Goals from "@/components/Goals";
import PlanTab from "@/components/PlanTab";
import DailyView from "@/components/DailyView";
import ProgressView from "@/components/ProgressView";

type Tab = "goals" | "plan" | "daily" | "progress";

const navItems: { id: Tab; icon: string; iconFilled: string; label: string }[] = [
  { id: "goals", icon: "flag", iconFilled: "flag", label: "Goals" },
  { id: "plan", icon: "psychology", iconFilled: "psychology", label: "Plan" },
  { id: "daily", icon: "checklist", iconFilled: "checklist", label: "Daily" },
  { id: "progress", icon: "monitoring", iconFilled: "monitoring", label: "Progress" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("goals");

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23] pb-24">
      {/* Top App Bar */}
      <header className="w-full sticky top-0 z-50 bg-gradient-to-b from-[#faf8ff] via-[#faf8ff] to-transparent">
        <div className="flex justify-between items-center px-6 pb-4 pt-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#003fb1]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                self_improvement
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#003fb1] tracking-tight">
              Kinetic Sanctuary
            </h1>
          </div>
          <button className="hover:-translate-y-1 transition-transform duration-300">
            <span className="material-symbols-outlined text-[#003fb1] text-2xl">
              auto_awesome
            </span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6">
        {tab === "goals" && <Goals />}
        {tab === "plan" && <PlanTab />}
        {tab === "daily" && <DailyView />}
        {tab === "progress" && <ProgressView />}
      </main>

      {/* Glassmorphic Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 glass-nav shadow-[0_-8px_32px_rgba(25,27,35,0.06)] rounded-t-[1.5rem]">
        {navItems.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-[#f3f3fe] text-[#003fb1] rounded-2xl scale-95"
                  : "text-[#434654] hover:opacity-80"
              }`}
            >
              <span
                className="material-symbols-outlined mb-1"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="uppercase text-[10px] tracking-widest font-bold">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
