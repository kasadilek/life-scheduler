"use client";

import { useState } from "react";
import GoalsList from "./GoalsList";
import GoalCreate from "./GoalCreate";
import GoalChat from "./GoalChat";
import GoalPlan from "./GoalPlan";

type View = "list" | "create" | "chat" | "plan";

export default function Goals() {
  const [view, setView] = useState<View>("list");
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [activeGoalTitle, setActiveGoalTitle] = useState("");

  function navigateToGoal(goalId: string, title: string, status: string) {
    setActiveGoalId(goalId);
    setActiveGoalTitle(title);
    setView(status === "drafting" ? "chat" : "plan");
  }

  function handleSelectGoal(goalId: string, title: string, status: string) {
    navigateToGoal(goalId, title, status);
  }

  function handleBack() {
    setView("list");
    setActiveGoalId(null);
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
        onPlanGenerated={() => setView("plan")}
        onBack={handleBack}
      />
    );
  }

  if (view === "plan" && activeGoalId) {
    return <GoalPlan goalId={activeGoalId} onBack={handleBack} />;
  }

  return (
    <GoalsList onNewGoal={() => setView("create")} onSelectGoal={handleSelectGoal} />
  );
}
