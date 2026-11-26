"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TaskBoard } from "@/components/TaskBoard";
import { Campaign, TaskItem } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mode, setMode] = useState<"supabase" | "local">("local");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      setTasks(data.tasks || []);
      setCampaigns(data.campaigns || []);
      if (data.mode) setMode(data.mode);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar mode={mode} />
      <main className="flex-1 p-5 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Execution & Task Tracker
          </h1>
          <p className="text-sm text-slate-500">
            Track action items, owners, and deadlines across your five growth strategies.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading tasks...
          </div>
        ) : (
          <TaskBoard tasks={tasks} campaigns={campaigns} onRefresh={loadAll} />
        )}
      </main>
    </div>
  );
}
