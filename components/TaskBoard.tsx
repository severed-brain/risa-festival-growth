"use client";

import { useState } from "react";
import { Campaign, TaskItem, TaskPriority, TaskStatus } from "@/lib/types";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

interface TaskBoardProps {
  tasks: TaskItem[];
  campaigns: Campaign[];
  onRefresh: () => Promise<void> | void;
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  done: "bg-emerald-50 text-emerald-700",
  blocked: "bg-rose-50 text-rose-700",
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

export function TaskBoard({ tasks, campaigns, onRefresh }: TaskBoardProps) {
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    campaign_id: campaigns[0]?.id || "",
    owner: "Riya",
    due_date: "2026-12-10",
    priority: "medium" as TaskPriority,
    notes: "",
  });

  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));
  const owners = Array.from(
    new Set(tasks.map((t) => t.owner).filter(Boolean) as string[])
  );

  // Use a clear reference campaign date (Dec 10, 2026) or today for overdue highlights
  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = tasks.filter((t) => {
    if (filterCampaign !== "all" && t.campaign_id !== filterCampaign) return false;
    if (filterOwner !== "all" && t.owner !== filterOwner) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await onRefresh();
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    await onRefresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        campaign_id: form.campaign_id || null,
        status: "pending",
      }),
    });
    setForm({
      title: "",
      campaign_id: campaigns[0]?.id || "",
      owner: "Riya",
      due_date: "2026-12-10",
      priority: "medium",
      notes: "",
    });
    setShowAdd(false);
    await onRefresh();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Execution Task Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Linked to campaigns • Filter by campaign, owner, or status • Overdue tasks highlighted
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <select
          value={filterCampaign}
          onChange={(e) => setFilterCampaign(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterOwner}
          onChange={(e) => setFilterOwner(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          <option value="all">All Owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-indigo-50/40 p-4 md:grid-cols-3"
        >
          <input
            type="text"
            required
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm md:col-span-2"
          />
          <select
            value={form.campaign_id}
            onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">General (No campaign)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Owner"
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as TaskPriority })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm md:col-span-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No tasks match the current filters.
          </div>
        ) : (
          filtered.map((task) => {
            const isOverdue =
              Boolean(task.due_date) &&
              task.status !== "done" &&
              (task.due_date as string) < todayStr;
            return (
              <div
                key={task.id}
                className={`flex flex-col justify-between gap-3 px-5 py-4 md:flex-row md:items-center ${
                  isOverdue ? "bg-rose-50/50" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        task.status === "done"
                          ? "text-slate-400 line-through"
                          : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium
                      }`}
                    >
                      {task.priority}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Campaign:{" "}
                    <span className="font-medium text-slate-700">
                      {task.campaign_id
                        ? campaignMap.get(task.campaign_id) || "Campaign"
                        : "General"}
                    </span>{" "}
                    • Owner: <span className="font-medium text-slate-700">{task.owner || "Team"}</span>{" "}
                    • Due:{" "}
                    <span className={isOverdue ? "font-semibold text-rose-600" : ""}>
                      {task.due_date || "No deadline"}
                    </span>
                  </p>
                  {task.notes && (
                    <p className="text-xs text-slate-500">{task.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className={`rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium capitalize ${
                      STATUS_BADGE[task.status] || STATUS_BADGE.pending
                    }`}
                  >
                    <option value="pending">pending</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                    <option value="blocked">blocked</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
