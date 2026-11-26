"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import { FunnelChart } from "@/components/FunnelChart";
import { DailyTrendChart } from "@/components/DailyTrendChart";
import { CampaignTable } from "@/components/CampaignTable";
import { HistoricalBenchmarkPanel } from "@/components/HistoricalBenchmarkPanel";
import { STRATEGY_THRESHOLDS } from "@/lib/analytics";
import { Campaign, DailyMetric, FunnelTarget, TaskItem } from "@/lib/types";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react";

interface DashboardPayload {
  mode: "supabase" | "local";
  campaigns: Campaign[];
  daily_metrics: DailyMetric[];
  tasks: TaskItem[];
  funnel_targets: FunnelTarget[];
  summary: {
    totalReach: number;
    totalRegs: number;
    totalTargetRegs: number;
    projectedAttendees: number;
    showUpRatePct: number;
    reachToRegPct: number;
    totalBudgetAllocated: number;
    totalBudgetSpent: number;
    budgetRemaining: number;
    blendedCpr: number;
    reachBase: number;
    regBase: number;
    attBase: number;
    attStretch: number;
    daysLeft: number;
    dailyTrend: Array<{
      date: string;
      registrations: number;
      cumulative_registrations: number;
      projected_cumulative_attendees: number;
    }>;
    diagnostics: Array<{
      campaignId: string;
      name: string;
      channel: string;
      status: string;
      attainmentPct: number;
      budgetUtilizationPct: number;
      cpr: number;
      avgDailyRegs: number;
      health: "scale" | "on_track" | "watch" | "at_risk";
      signal: string;
    }>;
  };
  historical: any;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  const atRisk =
    data?.summary.diagnostics.filter(
      (d) => d.health === "watch" || d.health === "at_risk"
    ) || [];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar mode={data?.mode} />
      <main className="flex-1 p-5 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Mumbai Festival Growth Command Center
            </h1>
            <p className="text-sm text-slate-500">
              Challenge A: Attendee Growth • Live funnel tracking, campaign diagnostics & AI copilot
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Bot className="h-4 w-4" />
            Ask AI Growth Analyst
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!data ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading live campaign metrics...
          </div>
        ) : (
          <>
            {/* Alert banner for campaigns below threshold */}
            {atRisk.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-2.5 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">
                      Attention needed on {atRisk.length} campaign(s):{" "}
                    </span>
                    {atRisk.map((a) => `${a.name} (${a.attainmentPct}%)`).join(", ")}
                  </div>
                </div>
                <Link
                  href="/chat"
                  className="text-xs font-semibold text-amber-900 underline"
                >
                  Diagnose with AI →
                </Link>
              </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                label="Total Registrations"
                value={data.summary.totalRegs.toLocaleString("en-IN")}
                sublabel={`Target: ${data.summary.regBase.toLocaleString("en-IN")} (${(
                  (data.summary.totalRegs / Math.max(data.summary.regBase, 1)) *
                  100
                ).toFixed(1)}%)`}
                progressPct={
                  (data.summary.totalRegs / Math.max(data.summary.regBase, 1)) * 100
                }
                accent="indigo"
                icon={<Users className="h-4 w-4" />}
              />
              <KPICard
                label="Projected Attendees"
                value={data.summary.projectedAttendees.toLocaleString("en-IN")}
                sublabel={`At ${data.summary.showUpRatePct}% show-up vs ${data.summary.attBase.toLocaleString(
                  "en-IN"
                )} base`}
                progressPct={
                  (data.summary.projectedAttendees /
                    Math.max(data.summary.attBase, 1)) *
                  100
                }
                accent="emerald"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KPICard
                label="Budget Spent"
                value={`₹${data.summary.totalBudgetSpent.toLocaleString("en-IN")}`}
                sublabel={`₹${data.summary.budgetRemaining.toLocaleString(
                  "en-IN"
                )} remaining • Blended CPR ₹${data.summary.blendedCpr}`}
                progressPct={
                  (data.summary.totalBudgetSpent /
                    Math.max(data.summary.totalBudgetAllocated, 1)) *
                  100
                }
                accent="amber"
                icon={<IndianRupee className="h-4 w-4" />}
              />
              <KPICard
                label="Days to Festival"
                value={`${data.summary.daysLeft}d`}
                sublabel={`Dec 22, 2026 • Reach→Reg: ${data.summary.reachToRegPct}%`}
                accent="slate"
                icon={<CalendarClock className="h-4 w-4" />}
              />
            </div>

            {/* Funnel + Trend */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FunnelChart
                totalReach={data.summary.totalReach}
                reachBase={data.summary.reachBase}
                totalRegs={data.summary.totalRegs}
                regBase={data.summary.regBase}
                projectedAttendees={data.summary.projectedAttendees}
                attBase={data.summary.attBase}
                attStretch={data.summary.attStretch}
              />
              <DailyTrendChart data={data.summary.dailyTrend} />
            </div>

            {/* Campaign table */}
            <CampaignTable campaigns={data.campaigns} onRefresh={loadData} />

            {/* Threshold Decision Rules Table (Slide 3 Operationalized) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Experimentation Guardrails (Scale / Stop Thresholds)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Leading indicators and decision rules from Slide 3 mapped to active channels
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Strategy</th>
                      <th className="px-3 py-2">Leading Indicator</th>
                      <th className="px-3 py-2">Scale Threshold</th>
                      <th className="px-3 py-2">Stop Threshold</th>
                      <th className="px-3 py-2">Live Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {STRATEGY_THRESHOLDS.map((rule) => {
                      const diag = data.summary.diagnostics.find(
                        (d) => d.channel === rule.channel
                      );
                      return (
                        <tr key={rule.channel}>
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {rule.strategy}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {rule.leadingIndicator}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-emerald-700">
                            {rule.scaleThreshold}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-rose-700">
                            {rule.stopThreshold}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {diag ? diag.signal : "No active campaign"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical CampusFest 2025 Benchmark Reference */}
            <HistoricalBenchmarkPanel historical={data.historical} />
          </>
        )}
      </main>
    </div>
  );
}
