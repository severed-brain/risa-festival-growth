"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CampaignTable } from "@/components/CampaignTable";
import { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mode, setMode] = useState<"supabase" | "local">("local");
  const [loading, setLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      if (data.mode) setMode(data.mode);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar mode={mode} />
      <main className="flex-1 p-5 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campaign Management
          </h1>
          <p className="text-sm text-slate-500">
            Edit budgets, registration actuals, owners, or campaign statuses — funnel totals update automatically.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading campaigns...
          </div>
        ) : (
          <CampaignTable
            campaigns={campaigns}
            editable
            onRefresh={loadCampaigns}
          />
        )}
      </main>
    </div>
  );
}
