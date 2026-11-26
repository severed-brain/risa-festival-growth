"use client";

import { useState } from "react";
import { ActionProposal } from "@/lib/types";
import { Bot, CheckCircle2, Play, Send, Sparkles, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionProposal[];
  executed?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Which live Mumbai campaign has the best cost per registration?",
  "What is our projected final attendance at current pace vs our 10,000 base target?",
  "In the historical CampusFest 2025 dataset, which campaign had the lowest cost per verified visitor and highest show-up rate?",
  "We are behind on College Club Tie-ups. What should we do and create a task for Kunal?",
  "What is the weather like in Mumbai on December 22?",
];

export function ChatWindow({ onActionExecuted }: { onActionExecuted?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your **AI Growth Analyst & Copilot** (`gemini-3.8-flash`). I'm grounded in both your **live Mumbai Dec 2026 campaign data** and the **original CampusFest 2025 historical dataset (`Attendee Dataset.xlsx`)**.\n\nAsk me to diagnose bottlenecks, compare channels, calculate ROI/CPR, or recommend actions—and when I suggest a task or budget shift, you can confirm and execute it with one click.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [executingKey, setExecutingKey] = useState<string | null>(null);

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: prompt,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          previousInteractionId: interactionId,
          conversationHistory: nextHistory
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chat request failed");
      }
      if (data.interactionId) {
        setInteractionId(data.interactionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          actions: data.actions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${
            err instanceof Error
              ? err.message
              : "Unable to reach Gemini API. Check GEMINI_API_KEY in .env.local."
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (
    msgId: string,
    actionIdx: number,
    proposal: ActionProposal
  ) => {
    const key = `${msgId}-${actionIdx}`;
    setExecutingKey(key);
    try {
      const res = await fetch("/api/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action execution failed");

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, executed: true } : m))
      );
      if (onActionExecuted) onActionExecuted();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to execute action");
    } finally {
      setExecutingKey(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              AI Growth Analyst & Copilot
            </h2>
            <p className="text-xs text-slate-500">
              Grounded in live Mumbai campaigns + CampusFest 2025 Excel dataset
            </p>
          </div>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
        {SUGGESTED_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-3xl space-y-2 rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  {m.actions.map((act, idx) => {
                    const key = `${m.id}-${idx}`;
                    return (
                      <div
                        key={key}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-white p-3"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                            Proposed Action: {act.action.replace("_", " ")}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                            {JSON.stringify(act.details)}
                          </p>
                        </div>

                        {m.executed ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Executed
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={executingKey === key}
                            onClick={() => executeProposal(m.id, idx, act)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Play className="h-3 w-3" />
                            {executingKey === key ? "Applying..." : "Confirm & Execute"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Bot className="h-4 w-4 animate-pulse text-indigo-600" />
            Analyzing live campaign metrics & dataset...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about campaign ROI, projections, CampusFest 2025 data, or request a task..."
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
}
