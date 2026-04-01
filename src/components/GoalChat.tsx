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
  onPlanGenerated: () => void;
  onBack: () => void;
};

export default function GoalChat({
  goalId,
  goalTitle,
  onPlanGenerated,
  onBack,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [readyToPlan, setReadyToPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initCalled = useRef(false);

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
    if (lastAssistant?.content.includes("[READY_TO_PLAN]")) {
      setReadyToPlan(true);
    }

    return existing;
  }, [goalId]);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    (async () => {
      const existing = await loadMessages();

      if (existing.length === 0) {
        setLoading(true);
        const chatRes = await fetch(`/api/life-goals/${goalId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `My goal is: ${goalTitle}. Let's start planning!`,
          }),
        });
        const data = await chatRes.json();
        if (data.readyToPlan) setReadyToPlan(true);
        await loadMessages();
        setLoading(false);
      }
    })();
  }, [goalId, goalTitle, loadMessages]);

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
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();
    if (data.readyToPlan) setReadyToPlan(true);
    await loadMessages();
    setLoading(false);
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/life-goals/${goalId}/generate-plan`, {
        method: "POST",
      });
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

  function displayContent(content: string) {
    return content.replace(/\[READY_TO_PLAN\]\s*/g, "").trim();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[#434654] hover:text-[#003fb1] transition-colors cursor-pointer mb-4"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="uppercase tracking-widest text-xs font-bold">Back</span>
        </button>
        <span className="uppercase text-[10px] tracking-widest text-[#5d00cc] font-bold block mb-2">
          AI Interview
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
              <div className="w-8 h-8 rounded-full bg-[#5d00cc] flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-white text-sm">
                  auto_awesome
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
            <div className="w-8 h-8 rounded-full bg-[#5d00cc] flex items-center justify-center mr-3 flex-shrink-0">
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

      {/* Generate Plan CTA */}
      {readyToPlan && !generating && (
        <button
          onClick={generatePlan}
          className="w-full py-5 mb-3 rounded-full ai-gradient text-white font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
        >
          Confirm & Generate Plan
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      )}

      {generating && (
        <div className="w-full py-5 mb-3 rounded-full ai-gradient-purple text-white font-bold text-center">
          <span className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Generating your strategy...
          </span>
        </div>
      )}

      {/* Input */}
      {!readyToPlan && (
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your thoughts..."
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
