"use client";

import { useState, useEffect, useCallback } from "react";

function ObjectiveChecklist({ objectives, taskDone }: { objectives: string[]; taskDone: boolean }) {
  const [checked, setChecked] = useState<boolean[]>(() => objectives.map(() => false));

  useEffect(() => {
    setChecked(objectives.map(() => false));
  }, [objectives.length]);

  function toggle(idx: number) {
    if (taskDone) return;
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  return (
    <div className="mt-3 space-y-1.5">
      <span className="text-[10px] font-bold text-[#434654] uppercase tracking-wider">
        Learning Goals
      </span>
      {objectives.map((obj, oi) => {
        const isChecked = taskDone || checked[oi];
        return (
          <label key={oi} className="flex items-start gap-2 text-xs text-[#434654] cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggle(oi)}
              className="mt-0.5 rounded accent-[#006c4a]"
            />
            <span className={isChecked ? "line-through opacity-40" : ""}>{obj}</span>
          </label>
        );
      })}
    </div>
  );
}

type Resource = {
  title: string;
  url: string;
  type: string;
  durationMins?: number;
};

type TaskType = {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  scheduledDate: string | null;
  estimatedMins: number | null;
  startHour: number | null;
  learningObjectives: string | null;
  resources: string | null;
  status: string;
};

type MilestoneType = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  tasks: TaskType[];
};

type GoalType = {
  id: string;
  title: string;
  planSummary: string | null;
  targetDate: string | null;
  status: string;
  milestones: MilestoneType[];
};

type Props = {
  goalId: string;
  onBack: () => void;
};

export default function GoalPlan({ goalId, onBack }: Props) {
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptResult, setAcceptResult] = useState<{ success: boolean; message: string } | null>(null);
  const [shifting, setShifting] = useState(false);

  const fetchGoal = useCallback(async () => {
    const res = await fetch(`/api/life-goals/${goalId}`);
    const data = await res.json();
    setGoal(data);
    setExpandedMilestone((prev) => {
      if (prev) return prev;
      const first = data.milestones?.find(
        (m: MilestoneType) => m.status !== "completed"
      );
      return first?.id ?? null;
    });
  }, [goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  async function acceptPlan() {
    setAccepting(true);
    setAcceptResult(null);
    try {
      const res = await fetch(`/api/life-goals/${goalId}/accept-plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setAcceptResult({
          success: true,
          message: `${data.eventCount} events added to Apple Calendar!`,
        });
        fetchGoal();
      } else {
        setAcceptResult({
          success: false,
          message: data.error || "Failed to add to calendar",
        });
      }
    } catch {
      setAcceptResult({
        success: false,
        message: "Calendar permission required. Allow access in System Settings.",
      });
    }
    setAccepting(false);
  }

  async function shiftDates(newStartDate: string) {
    setShifting(true);
    await fetch(`/api/life-goals/${goalId}/shift-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: newStartDate }),
    });
    await fetchGoal();
    setShifting(false);
  }

  const earliestTaskDate = goal?.milestones
    .flatMap((m) => m.tasks)
    .filter((t) => t.scheduledDate)
    .map((t) => new Date(t.scheduledDate!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const startDateStr = earliestTaskDate
    ? earliestTaskDate.toISOString().split("T")[0]
    : "";

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await fetch(`/api/life-goals/${goalId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchGoal();
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-[#003fb1] text-3xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const totalTasks = goal.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const completedTasks = goal.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.status === "completed").length,
    0
  );
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-10 pb-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#434654] hover:text-[#003fb1] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span className="uppercase tracking-widest text-xs font-bold">Back to Goals</span>
      </button>

      {/* Hero */}
      <section>
        <span className="uppercase text-[10px] tracking-widest text-[#003fb1] font-bold block mb-2">
          {goal.status === "planned" ? "Strategy Generated" : "Active Journey"}
        </span>
        <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-3">
          {goal.title}
        </h2>
        {goal.planSummary && (
          <div className="flex items-start gap-3 text-[#434654] mt-4">
            <span className="material-symbols-outlined text-[#5d00cc] flex-shrink-0">psychology</span>
            <p className="text-sm leading-relaxed">{goal.planSummary}</p>
          </div>
        )}
      </section>

      {/* Start date picker */}
      {goal.status === "planned" && startDateStr && (
        <div className="flex items-center gap-4 bg-[#f3f3fe] rounded-xl p-4">
          <span className="material-symbols-outlined text-[#003fb1]">calendar_month</span>
          <label className="text-sm font-medium text-[#434654]">Start date:</label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => e.target.value && shiftDates(e.target.value)}
            disabled={shifting}
            className="px-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#003fb1]/20 border-0 cursor-pointer"
          />
          {shifting && <span className="text-xs text-[#434654]">Shifting...</span>}
        </div>
      )}

      {/* Progress */}
      <div className="bg-[#f3f3fe] rounded-xl p-6">
        <div className="flex justify-between items-end mb-3">
          <span className="uppercase tracking-wider text-xs font-bold text-[#434654]">
            Mastery Progress
          </span>
          <span className="text-3xl font-extrabold text-[#003fb1]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="flex gap-1 h-3 w-full">
          {Array.from({ length: 6 }).map((_, i) => {
            const segmentPct = ((i + 1) / 6) * 100;
            const filled = progress >= segmentPct;
            return (
              <div
                key={i}
                className={`flex-1 ${filled ? "bg-[#006c4a]" : "bg-[#e2e1ed]"} ${
                  i === 0 ? "rounded-l-full" : ""
                } ${i === 5 ? "rounded-r-full" : ""}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-xs text-[#434654]">
          <span>{completedTasks} / {totalTasks} tasks completed</span>
          {goal.targetDate && (
            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Accept Plan CTA */}
      {goal.status === "planned" && !acceptResult?.success && (
        <div className="space-y-4">
          <button
            onClick={acceptPlan}
            disabled={accepting}
            className="w-full py-5 rounded-full ai-gradient text-white font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {accepting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Adding to Calendar...
              </>
            ) : (
              <>
                Confirm & Start Plan
                <span className="material-symbols-outlined">rocket_launch</span>
              </>
            )}
          </button>
          <button className="w-full py-4 rounded-full border-2 border-[#c3c5d7] text-[#003dab] font-bold flex items-center justify-center gap-3 hover:bg-[#f3f3fe] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">calendar_month</span>
            Export to Calendar
          </button>
        </div>
      )}

      {acceptResult && (
        <div
          className={`p-5 rounded-xl text-sm font-medium ${
            acceptResult.success
              ? "bg-[#85f8c4] text-[#002114]"
              : "bg-[#ffdad6] text-[#93000a]"
          }`}
        >
          {acceptResult.message}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-[#e2e1ed]" />

        <div className="space-y-8">
          {goal.milestones.map((milestone, idx) => {
            const isExpanded = expandedMilestone === milestone.id;
            const milestoneDone = milestone.status === "completed";
            const isCurrent = !milestoneDone && (idx === 0 || goal.milestones[idx - 1]?.status === "completed");
            const milestoneTasksDone = milestone.tasks.filter((t) => t.status === "completed").length;

            return (
              <div key={milestone.id} className="relative pl-16">
                {/* Timeline dot */}
                <div
                  className={`absolute left-3 top-2 z-10 ${
                    isCurrent
                      ? "w-6 h-6 rounded-full bg-[#7632e7] flex items-center justify-center border-4 border-[#faf8ff] shadow-md"
                      : milestoneDone
                      ? "w-4 h-4 rounded-full bg-[#003fb1] border-4 border-[#faf8ff] shadow-sm left-4"
                      : "w-4 h-4 rounded-full bg-[#e2e1ed] border-4 border-[#faf8ff] shadow-sm left-4"
                  }`}
                >
                  {isCurrent && (
                    <span
                      className="material-symbols-outlined text-white text-[12px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bolt
                    </span>
                  )}
                </div>

                {/* Milestone Card */}
                <div
                  className={`rounded-xl p-6 transition-all duration-300 ${
                    isCurrent
                      ? "bg-[#e7e7f3] border-l-4 border-[#5d00cc]"
                      : milestoneDone
                      ? "bg-white"
                      : "bg-white opacity-80"
                  } ${!milestoneDone ? "hover:-translate-y-1" : ""}`}
                >
                  <button
                    onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`uppercase text-xs font-bold tracking-wider ${
                        isCurrent ? "text-[#5d00cc]" : milestoneDone ? "text-[#003fb1]" : "text-[#434654]"
                      }`}>
                        {milestone.title.match(/week/i) ? milestone.title.split(":")[0] : `Phase ${idx + 1}`}
                        {isCurrent && " • Current Focus"}
                      </span>
                      {milestoneDone ? (
                        <span className="material-symbols-outlined text-[#006c4a] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[#434654] text-sm">
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                      )}
                    </div>
                    <h3 className={`${isCurrent ? "text-xl" : "text-lg"} font-bold mb-2`}>
                      {milestone.title.includes(":") ? milestone.title.split(":").slice(1).join(":").trim() : milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="text-[#434654] text-sm leading-relaxed mb-3">{milestone.description}</p>
                    )}
                    <span className="text-[10px] font-bold text-[#434654] uppercase tracking-wider">
                      {milestoneTasksDone}/{milestone.tasks.length} tasks
                      {milestone.targetDate && ` · by ${new Date(milestone.targetDate).toLocaleDateString()}`}
                    </span>
                  </button>

                  {/* Tasks */}
                  {isExpanded && (
                    <div className="mt-6 space-y-3">
                      {milestone.tasks.map((task) => {
                        const dateStr = task.scheduledDate
                          ? new Date(task.scheduledDate).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : null;

                        let objectives: string[] = [];
                        try { if (task.learningObjectives) objectives = JSON.parse(task.learningObjectives); } catch { /* */ }

                        let resources: Resource[] = [];
                        try { if (task.resources) resources = JSON.parse(task.resources); } catch { /* */ }

                        const taskDone = task.status === "completed";

                        return (
                          <div
                            key={task.id}
                            className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                              taskDone ? "bg-[#85f8c4]/20" : "bg-white hover:-translate-y-0.5"
                            }`}
                          >
                            <button
                              onClick={() => toggleTask(task.id, task.status)}
                              className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                                taskDone
                                  ? "bg-[#006c4a]"
                                  : "border-2 border-[#c3c5d7] hover:border-[#003fb1]"
                              }`}
                            >
                              {taskDone && (
                                <span className="material-symbols-outlined text-white text-sm">check</span>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                {dateStr && (
                                  <span className="text-[10px] font-bold text-[#003fb1] uppercase tracking-wider whitespace-nowrap">
                                    {dateStr}
                                  </span>
                                )}
                                <span className={`font-bold text-sm ${taskDone ? "line-through opacity-50" : ""}`}>
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-[#434654] mt-1">{task.description}</p>
                              )}

                              {/* Duration + time chips */}
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {task.estimatedMins && (
                                  <span className="px-3 py-1 bg-[#ededf8] rounded-full text-[9px] font-bold uppercase tracking-wider text-[#434654]">
                                    {task.estimatedMins} mins
                                  </span>
                                )}
                              </div>

                              {objectives.length > 0 && (
                                <ObjectiveChecklist objectives={objectives} taskDone={taskDone} />
                              )}

                              {/* Resources */}
                              {resources.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {resources.map((r, ri) => {
                                    const icons: Record<string, string> = { video: "play_circle", docs: "description", article: "article", course: "school" };
                                    return (
                                      <a
                                        key={ri}
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-[#dbe1ff] text-[#003fb1] hover:bg-[#b5c4ff] transition-colors font-medium"
                                      >
                                        <span className="material-symbols-outlined text-[12px]">{icons[r.type] || "link"}</span>
                                        <span className="truncate max-w-[120px]">{r.title}</span>
                                        {r.durationMins && <span className="opacity-60">{r.durationMins}m</span>}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
