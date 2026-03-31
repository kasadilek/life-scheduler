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

  // Load existing messages and start conversation
  const initChat = useCallback(async () => {
    const existing = await loadMessages();

    // If no messages yet, send an initial greeting to kick off the interview
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
  }, [goalId, goalTitle, loadMessages]);

  useEffect(() => {
    initChat();
  }, [initChat]);

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
    await fetch(`/api/life-goals/${goalId}/generate-plan`, {
      method: "POST",
    });
    setGenerating(false);
    onPlanGenerated();
  }

  function displayContent(content: string) {
    return content.replace(/\[READY_TO_PLAN\]\s*/g, "").trim();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          &larr;
        </button>
        <h2 className="font-semibold truncate">{goalTitle}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {displayContent(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generate plan button */}
      {readyToPlan && !generating && (
        <button
          onClick={generatePlan}
          className="w-full py-3 mb-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Generate My Plan
        </button>
      )}

      {generating && (
        <div className="w-full py-3 mb-3 bg-blue-600/80 text-white rounded-xl font-medium text-center">
          Generating your plan...
        </div>
      )}

      {/* Input */}
      {!readyToPlan && (
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
