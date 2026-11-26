import { NextResponse } from "next/server";
import { getStoreSnapshot } from "@/lib/store";
import { computeDashboardSummary } from "@/lib/analytics";
import { getHistoricalDataset } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getStoreSnapshot();
    const summary = computeDashboardSummary(
      snapshot.campaigns,
      snapshot.daily_metrics,
      snapshot.funnel_targets
    );
    const historical = getHistoricalDataset();
    return NextResponse.json({
      ...snapshot,
      summary,
      historical,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
