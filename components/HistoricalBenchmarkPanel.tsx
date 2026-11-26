"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";

interface HistoricalCampaign {
  campaign_id: string;
  campaign_name: string;
  owner_name: string;
  marketing_spend_inr: number;
  identified_external_people_first_touch: number;
  registered_external_people: number;
  verified_external_visitors: number;
  cost_per_registered_person_inr: number | null;
  cost_per_verified_visitor_inr: number | null;
  reg_to_visit_show_up_pct: number;
}

interface HistoricalDataset {
  dataset_name: string;
  notes: string[];
  totals: {
    external_people_identified: number;
    distinct_external_registered_people: number;
    distinct_verified_admitted_external_visitors: number;
    unattributed_walkin_verified_external_visitors: number;
    total_net_marketing_spend_inr: number;
    overall_cost_per_external_registration_inr: number;
    overall_cost_per_verified_external_visitor_inr: number;
  };
  campaigns: HistoricalCampaign[];
}

export function HistoricalBenchmarkPanel({
  historical,
}: {
  historical: HistoricalDataset | null;
}) {
  const [open, setOpen] = useState(false);

  if (!historical) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50/60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Historical Benchmark Reference: {historical.dataset_name}
            </h2>
            <p className="text-xs text-slate-500">
              {historical.totals.external_people_identified.toLocaleString("en-IN")} external people →{" "}
              {historical.totals.distinct_external_registered_people.toLocaleString("en-IN")} registered →{" "}
              {historical.totals.distinct_verified_admitted_external_visitors.toLocaleString("en-IN")} verified visitors (₹
              {historical.totals.total_net_marketing_spend_inr.toLocaleString("en-IN")} spend)
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-200 p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            {historical.notes.map((n) => (
              <p key={n}>• {n}</p>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Campaign</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2 text-right">Spend (₹)</th>
                  <th className="px-3 py-2 text-right">Ext People</th>
                  <th className="px-3 py-2 text-right">Registered</th>
                  <th className="px-3 py-2 text-right">Verified Visitors</th>
                  <th className="px-3 py-2 text-right">Show-up %</th>
                  <th className="px-3 py-2 text-right">CPR (₹)</th>
                  <th className="px-3 py-2 text-right">CPV (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historical.campaigns.map((c) => (
                  <tr key={c.campaign_id}>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {c.campaign_id} • {c.campaign_name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{c.owner_name}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ₹{c.marketing_spend_inr.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.identified_external_people_first_touch}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.registered_external_people}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.verified_external_visitors}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.reg_to_visit_show_up_pct}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ₹{c.cost_per_registered_person_inr ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ₹{c.cost_per_verified_visitor_inr ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
