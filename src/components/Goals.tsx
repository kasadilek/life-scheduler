"use client";

import { useState, useEffect } from "react";
import GoalsList from "./GoalsList";
import GoalCreate from "./GoalCreate";
import GoalChat from "./GoalChat";
import GoalPlan from "./GoalPlan";

type View = "list" | "create" | "chat" | "plan";
type ChatMode = "interview" | "adapt";

type Props = {
  adaptGoal?: { id: string; title: string } | null;
  onAdaptConsumed?: () => void;
};

export default function Goals({ adaptGoal, onAdaptConsumed }: Props) {
  const [view, setView] = useState<View>("list");
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [activeGoalTitle, setActiveGoalTitle] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("interview");

  // Handle adapt navigation from PlanTab via page-level state
  useEffect(() => {
    if (adaptGoal) {
      setActiveGoalId(adaptGoal.id);
      setActiveGoalTitle(adaptGoal.title);
      setChatMode("adapt");
      setView("chat");
      onAdaptConsumed?.();
    }
  }, [adaptGoal, onAdaptConsumed]);

  function navigateToGoal(goalId: string, title: string, status: string) {
    setActiveGoalId(goalId);
    setActiveGoalTitle(title);
    if (status === "adapting") {
      setChatMode("adapt");
      setView("chat");
    } else {
      setChatMode("interview");
      setView(status === "drafting" ? "chat" : "plan");
    }
  }

  function handleSelectGoal(goalId: string, title: string, status: string) {
    navigateToGoal(goalId, title, status);
  }

  function handleAdapt(goalId: string, title: string) {
    setActiveGoalId(goalId);
    setActiveGoalTitle(title);
    setChatMode("adapt");
    setView("chat");
  }

  function handleBack() {
    setView("list");
    setActiveGoalId(null);
    setChatMode("interview");
  }

  if (view === "create") {
    return (
      <GoalCreate
        onCreated={(goalId, title) => navigateToGoal(goalId, title, "drafting")}
        onCancel={handleBack}
      />
    );
  }

  if (view === "chat" && activeGoalId) {
    return (
      <GoalChat
        goalId={activeGoalId}
        goalTitle={activeGoalTitle}
        mode={chatMode}
        onPlanGenerated={() => setView("plan")}
        onBack={chatMode === "adapt" ? () => setView("plan") : handleBack}
      />
    );
  }

  if (view === "plan" && activeGoalId) {
    return (
      <GoalPlan
        goalId={activeGoalId}
        onBack={handleBack}
        onAdapt={handleAdapt}
      />
    );
  }

  return (
    <GoalsList onNewGoal={() => setView("create")} onSelectGoal={handleSelectGoal} />
  );
}
