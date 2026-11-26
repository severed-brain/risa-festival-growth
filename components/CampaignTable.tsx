"use client";

import { useState } from "react";
import { Campaign, CampaignStatus } from "@/lib/types";
import { ArrowUpDown, Check, Pencil, Plus, X } from "lucide-react";

interface CampaignTableProps {
  campaigns: Campaign[];
  editable?: boolean;
  onRefresh: () => Promise<void> | void;
}

const STATUS_STYLE: Record<CampaignStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  stopped: "bg-rose-50 text-rose-700 border-rose-200",
};

export function CampaignTable({
  campaigns,
  editable = false,
  onRefresh,
}: CampaignTableProps) {
  const [sortBy, setSortBy] = useState<"attainment" | "cpr" | "actual">("attainment");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Campaign>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    name: "",
    channel: "instagram",
    status: "active" as CampaignStatus,
    budget_allocated: 10000,
    budget_spent: 0,
    target_registrations: 1000,
    actual_registrations: 0,
    owner: "",
    start_date: "2026-12-01",
    end_date: "2026-12-21",
    notes: "",
  });

  const sorted = [...campaigns].sort((a, b) => {
    if (sortBy === "actual") {
      return b.actual_registrations - a.actual_registrations;
    }
    if (sortBy === "cpr") {
      const cprA = a.actual_registrations > 0 ? a.budget_spent / a.actual_registrations : 999999;
      const cprB = b.actual_registrations > 0 ? b.budget_spent / b.actual_registrations : 999999;
      return cprA - cprB;
    }
    const attA = a.target_registrations > 0 ? a.actual_registrations / a.target_registrations : 0;
    const attB = b.target_registrations > 0 ? b.actual_registrations / b.target_registrations : 0;
    return attB - attA;
  });

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setDraft({ ...c });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/campaigns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          channel: draft.channel,
          status: draft.status,
          budget_allocated: Number(draft.budget_allocated || 0),
          budget_spent: Number(draft.budget_spent || 0),
          target_registrations: Number(draft.target_registrations || 0),
          actual_registrations: Number(draft.actual_registrations || 0),
          owner: draft.owner,
          start_date: draft.start_date,
          end_date: draft.end_date,
          notes: draft.notes,
        }),
      });
      setEditingId(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRow.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRow),
      });
      setShowAdd(false);
      setNewRow({
        name: "",
        channel: "instagram",
        status: "active",
        budget_allocated: 10000,
        budget_spent: 0,
        target_registrations: 1000,
        actual_registrations: 0,
        owner: "",
        start_date: "2026-12-01",
        end_date: "2026-12-21",
        notes: "",
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Campaign Performance & ROI
          </h2>
          <p className="text-xs text-slate-500">
            {editable
              ? "Click edit on any row to update actuals, spend, or status — dashboard updates live."
              : "Sorted by target attainment, cost per registration (CPR), or volume."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setSortBy((prev) =>
                prev === "attainment" ? "cpr" : prev === "cpr" ? "actual" : "attainment"
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort:{" "}
            {sortBy === "attainment"
              ? "Attainment %"
              : sortBy === "cpr"
                ? "Lowest CPR"
                : "Total Regs"}
          </button>

          {editable && (
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Campaign
            </button>
          )}
        </div>
      </div>

      {editable && showAdd && (
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-indigo-50/40 p-4 md:grid-cols-4"
        >
          <input
            type="text"
            placeholder="Campaign name *"
            required
            value={newRow.name}
            onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Channel (e.g. influencer)"
            value={newRow.channel}
            onChange={(e) => setNewRow({ ...newRow, channel: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Owner"
            value={newRow.owner}
            onChange={(e) => setNewRow({ ...newRow, owner: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Target Regs"
            value={newRow.target_registrations}
            onChange={(e) =>
              setNewRow({ ...newRow, target_registrations: Number(e.target.value) })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Budget Allocated (INR)"
            value={newRow.budget_allocated}
            onChange={(e) =>
              setNewRow({ ...newRow, budget_allocated: Number(e.target.value) })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={newRow.start_date}
            onChange={(e) => setNewRow({ ...newRow, start_date: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={newRow.end_date}
            onChange={(e) => setNewRow({ ...newRow, end_date: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create"}
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Budget Spent / Alloc</th>
              <th className="px-4 py-3 text-right">Actual / Target Regs</th>
              <th className="px-4 py-3 text-right">CPR (₹)</th>
              <th className="px-4 py-3 text-right">Attainment</th>
              {editable && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((c) => {
              const isEditing = editingId === c.id;
              const attainment =
                c.target_registrations > 0
                  ? ((c.actual_registrations / c.target_registrations) * 100).toFixed(1)
                  : "0.0";
              const cpr =
                c.actual_registrations > 0
                  ? (c.budget_spent / c.actual_registrations).toFixed(2)
                  : "0.00";

              return (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        className="w-44 rounded border border-slate-300 px-2 py-1 text-sm"
                        value={draft.name || ""}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.channel || "direct"} • {c.start_date || "?"} to {c.end_date || "?"}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        value={draft.status || "active"}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            status: e.target.value as CampaignStatus,
                          })
                        }
                      >
                        <option value="active">active</option>
                        <option value="paused">paused</option>
                        <option value="stopped">stopped</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLE[c.status] || STATUS_STYLE.active
                        }`}
                      >
                        {c.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {isEditing ? (
                      <input
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
                        value={draft.owner || ""}
                        onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                      />
                    ) : (
                      c.owner || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <input
                          type="number"
                          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right"
                          value={draft.budget_spent ?? 0}
                          onChange={(e) =>
                            setDraft({ ...draft, budget_spent: Number(e.target.value) })
                          }
                        />
                        <span>/</span>
                        <input
                          type="number"
                          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right"
                          value={draft.budget_allocated ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              budget_allocated: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    ) : (
                      `₹${Number(c.budget_spent).toLocaleString("en-IN")} / ₹${Number(
                        c.budget_allocated
                      ).toLocaleString("en-IN")}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-800">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <input
                          type="number"
                          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right"
                          value={draft.actual_registrations ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              actual_registrations: Number(e.target.value),
                            })
                          }
                        />
                        <span>/</span>
                        <input
                          type="number"
                          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right"
                          value={draft.target_registrations ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              target_registrations: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    ) : (
                      `${c.actual_registrations.toLocaleString("en-IN")} / ${c.target_registrations.toLocaleString("en-IN")}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                    ₹{cpr}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                        Number(attainment) >= 60
                          ? "bg-emerald-50 text-emerald-700"
                          : Number(attainment) >= 40
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {attainment}%
                    </span>
                  </td>
                  {editable && (
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={saveEdit}
                            className="rounded bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded bg-slate-200 p-1.5 text-slate-700 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
