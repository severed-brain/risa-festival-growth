"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";

export default function ChatPage() {
  const [mode, setMode] = useState<"supabase" | "local">("local");

  useEffect(() => {
    fetch("/api/campaigns", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.mode) setMode(d.mode);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar mode={mode} />
      <main className="flex-1 p-5 md:p-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Growth Analyst & Copilot
          </h1>
          <p className="text-sm text-slate-500">
            Ask diagnostic questions, run calculations, or convert insights directly into tracked tasks.
          </p>
        </div>
        <ChatWindow />
      </main>
    </div>
  );
}
