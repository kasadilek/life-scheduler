"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  goalId: string;
  goalTitle: string;
  mode: "interview" | "adapt";
  onPlanGenerated: () => void;
  onBack: () => void;
};

export default function GoalChat({
  goalId,
  goalTitle,
  mode,
  onPlanGenerated,
  onBack,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initCalled = useRef(false);

  const isAdapt = mode === "adapt";
  const readyToken = isAdapt ? "[READY_TO_ADAPT]" : "[READY_TO_PLAN]";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/life-goals/${goalId}`);
    const goal = await res.json();
    const existing: Message[] = goal.chatMessages || [];
    setMessages(existing);

    const lastAssistant = [...existing]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant?.content.includes(readyToken)) {
      setReady(true);
    }

    return existing;
  }, [goalId]);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    (async () => {
      const existing = await loadMessages();

      const hasAdaptMessages = existing.some(
        (m) => m.role === "user" && m.content.includes("Ask me what I'd like to change")
      );
      if (isAdapt && !hasAdaptMessages) {
        setLoading(true);
        const chatRes = await fetch(`/api/life-goals/${goalId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `I want to adapt my existing plan for: ${goalTitle}. Ask me what I'd like to change.`,
            phase: "adapt",
          }),
        });
        const data = await chatRes.json();
        if (data.readyToAdapt) setReady(true);
        await loadMessages();
        setLoading(false);
      } else if (!isAdapt && existing.length === 0) {
        setLoading(true);
        const chatRes = await fetch(`/api/life-goals/${goalId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `My goal is: ${goalTitle}. Let's start planning!`,
          }),
        });
        const data = await chatRes.json();
        if (data.readyToPlan) setReady(true);
        await loadMessages();
        setLoading(false);
      }
    })();
  }, [goalId, goalTitle, loadMessages, isAdapt]);

  useEffect(scrollToBottom, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: "user", content: userMsg },
    ]);
    setLoading(true);

    const res = await fetch(`/api/life-goals/${goalId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        phase: isAdapt ? "adapt" : "interview",
      }),
    });
    const data = await res.json();
    if (data.readyToPlan || data.readyToAdapt) setReady(true);
    await loadMessages();
    setLoading(false);
  }

  async function generatePlan() {
    setGenerating(true);
    const endpoint = isAdapt
      ? `/api/life-goals/${goalId}/adapt-plan`
      : `/api/life-goals/${goalId}/generate-plan`;
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(`Plan generation failed: ${data.error || "Unknown error"}. Please try again.`);
        setGenerating(false);
        return;
      }
    } catch {
      alert("Plan generation timed out. Please try again.");
      setGenerating(false);
      return;
    }
    setGenerating(false);
    onPlanGenerated();
  }

  async function cancelAdaptation() {
    setCancelling(true);
    const res = await fetch(`/api/life-goals/${goalId}`);
    const goal = await res.json();
    await fetch(`/api/life-goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: goal.previousStatus || "planned",
        previousStatus: null,
      }),
    });
    setCancelling(false);
    onBack();
  }

  function displayContent(content: string) {
    return content
      .replace(/\[READY_TO_PLAN\]\s*/g, "")
      .replace(/\[READY_TO_ADAPT\]\s*/g, "")
      .trim();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={isAdapt ? cancelAdaptation : onBack}
            disabled={cancelling}
            className="group flex items-center gap-2 text-[#434654] hover:text-[#003fb1] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="uppercase tracking-widest text-xs font-bold">
              {isAdapt ? (cancelling ? "Cancelling..." : "Cancel Adaptation") : "Back"}
            </span>
          </button>
        </div>
        <span className={`uppercase text-[10px] tracking-widest font-bold block mb-2 ${
          isAdapt ? "text-[#006c4a]" : "text-[#5d00cc]"
        }`}>
          {isAdapt ? "Adapt Your Goal" : "AI Interview"}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight">{goalTitle}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 hide-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1 ${
                isAdapt ? "bg-[#006c4a]" : "bg-[#5d00cc]"
              }`}>
                <span className="material-symbols-outlined text-white text-sm">
                  {isAdapt ? "tune" : "auto_awesome"}
                </span>
              </div>
            )}
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "ai-gradient text-white rounded-br-md"
                  : "bg-white text-[#191b23] rounded-bl-md editorial-shadow"
              }`}
            >
              {displayContent(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              isAdapt ? "bg-[#006c4a]" : "bg-[#5d00cc]"
            }`}>
              <span className="material-symbols-outlined text-white text-sm animate-spin">
                progress_activity
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-bl-md text-sm text-[#434654] editorial-shadow">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generate / Regenerate Plan CTA */}
      {ready && !generating && (
        <button
          onClick={generatePlan}
          className={`w-full py-5 mb-3 rounded-full text-white font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${
            isAdapt ? "bg-[#006c4a] hover:bg-[#005a3e]" : "ai-gradient"
          }`}
        >
          {isAdapt ? "Regenerate Plan" : "Confirm & Generate Plan"}
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      )}

      {generating && (
        <div className={`w-full py-5 mb-3 rounded-full text-white font-bold text-center ${
          isAdapt ? "bg-[#006c4a]" : "ai-gradient-purple"
        }`}>
          <span className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            {isAdapt ? "Regenerating your strategy..." : "Generating your strategy..."}
          </span>
        </div>
      )}

      {/* Input */}
      {!generating && (
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAdapt ? "Describe what you'd like to change..." : "Share your thoughts..."}
              className="w-full bg-white p-4 pr-12 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003fb1]/20 editorial-shadow border-0"
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-full ai-gradient text-white flex items-center justify-center hover:-translate-y-1 transition-all duration-300 cursor-pointer disabled:opacity-40 flex-shrink-0"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      )}
    </div>
  );
}
