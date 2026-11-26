import { Campaign, DailyMetric, FunnelTarget } from "./types";

export interface ThresholdRule {
  channel: string;
  strategy: string;
  leadingIndicator: string;
  scaleThreshold: string;
  stopThreshold: string;
}

export const STRATEGY_THRESHOLDS: ThresholdRule[] = [
  {
    channel: "ambassador",
    strategy: "Campus Ambassadors",
    leadingIndicator: "Regs / ambassador / week",
    scaleThreshold: "> 80 regs/amb",
    stopThreshold: "< 30 regs/amb after wk 1",
  },
  {
    channel: "instagram",
    strategy: "Reel Contest",
    leadingIndicator: "Daily shares + hashtag velocity",
    scaleThreshold: "500 shares in 48h",
    stopThreshold: "< 100 shares in 48h",
  },
  {
    channel: "direct",
    strategy: "Ticket Split",
    leadingIndicator: "Free registration rate",
    scaleThreshold: "> 500/day",
    stopThreshold: "< 100/day after launch",
  },
  {
    channel: "clubs",
    strategy: "Club Tie-ups",
    leadingIndicator: "Clubs signed per day",
    scaleThreshold: "3+ clubs/day",
    stopThreshold: "< 1 club/day after wk 1",
  },
  {
    channel: "email",
    strategy: "Email/WhatsApp",
    leadingIndicator: "Open rate + CTR",
    scaleThreshold: "> 40% open rate",
    stopThreshold: "< 15% open rate",
  },
];

export interface CampaignDiagnostic {
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
}

export function diagnoseCampaigns(
  campaigns: Campaign[],
  dailyMetrics: DailyMetric[]
): CampaignDiagnostic[] {
  const byCamp = new Map<string, DailyMetric[]>();
  for (const m of dailyMetrics) {
    const arr = byCamp.get(m.campaign_id) || [];
    arr.push(m);
    byCamp.set(m.campaign_id, arr);
  }

  return campaigns.map((c) => {
    const metrics = byCamp.get(c.id) || [];
    const daysCount = Math.max(metrics.length, 1);
    const avgDailyRegs = Number((c.actual_registrations / daysCount).toFixed(1));
    const attainmentPct =
      c.target_registrations > 0
        ? Number(
            ((c.actual_registrations / c.target_registrations) * 100).toFixed(1)
          )
        : 0;
    const budgetUtilizationPct =
      c.budget_allocated > 0
        ? Number(((c.budget_spent / c.budget_allocated) * 100).toFixed(1))
        : 0;
    const cpr =
      c.actual_registrations > 0
        ? Number((c.budget_spent / c.actual_registrations).toFixed(2))
        : 0;

    const reachForCamp = metrics.reduce((acc, m) => acc + (m.reach || 0), 0);
    const convPct =
      reachForCamp > 0
        ? Number(((c.actual_registrations / reachForCamp) * 100).toFixed(2))
        : 0;

    let health: CampaignDiagnostic["health"] = "on_track";
    let signal = `On track (${attainmentPct}% of target, ${avgDailyRegs}/day)`;

    if (c.status === "stopped") {
      health = "at_risk";
      signal = "Campaign stopped — review reallocation";
    } else if (attainmentPct >= 75 || (attainmentPct >= 48 && cpr <= 8 && convPct >= 5)) {
      health = "scale";
      signal = `High ROI (${attainmentPct}% target, ₹${cpr} CPR, ${convPct}% conv) — scale`;
    } else if (attainmentPct < 40 || (reachForCamp > 20000 && convPct < 2.0)) {
      health = "at_risk";
      signal = `Low reach→reg conversion (${convPct}%, ₹${cpr} CPR) — audit creative`;
    } else if (attainmentPct < 48 || c.channel === "clubs") {
      health = "watch";
      signal = `Trailing target (${attainmentPct}%, ${avgDailyRegs}/day) — monitor closely`;
    }

    return {
      campaignId: c.id,
      name: c.name,
      channel: c.channel || "direct",
      status: c.status,
      attainmentPct,
      budgetUtilizationPct,
      cpr,
      avgDailyRegs,
      health,
      signal,
    };
  });
}

export function computeDashboardSummary(
  campaigns: Campaign[],
  dailyMetrics: DailyMetric[],
  funnelTargets: FunnelTarget[]
) {
  const totalReach = dailyMetrics.reduce((acc, m) => acc + (m.reach || 0), 0);
  const totalRegsFromCampaigns = campaigns.reduce(
    (acc, c) => acc + (c.actual_registrations || 0),
    0
  );
  const totalTargetRegs = campaigns.reduce(
    (acc, c) => acc + (c.target_registrations || 0),
    0
  );
  const totalBudgetAllocated = campaigns.reduce(
    (acc, c) => acc + (Number(c.budget_allocated) || 0),
    0
  );
  const totalBudgetSpent = campaigns.reduce(
    (acc, c) => acc + (Number(c.budget_spent) || 0),
    0
  );

  // 67% benchmark show-up rate from Slide 1 strategy
  const showUpRate = 0.67;
  const projectedAttendees = Math.round(totalRegsFromCampaigns * showUpRate);

  const reachTarget = funnelTargets.find((f) => f.metric === "reach");
  const regTarget = funnelTargets.find((f) => f.metric === "registrations");
  const attTarget = funnelTargets.find((f) => f.metric === "attendees");

  const reachBase = reachTarget?.base_target || 83000;
  const regBase = regTarget?.base_target || 15000;
  const attBase = attTarget?.base_target || 10000;
  const attStretch = attTarget?.stretch_target || 18000;

  const reachToRegPct =
    totalReach > 0
      ? Number(((totalRegsFromCampaigns / totalReach) * 100).toFixed(1))
      : 0;
  const blendedCpr =
    totalRegsFromCampaigns > 0
      ? Number((totalBudgetSpent / totalRegsFromCampaigns).toFixed(2))
      : 0;

  // Group daily metrics by date for trend chart
  const byDate = new Map<
    string,
    { date: string; reach: number; registrations: number; attendees: number }
  >();
  for (const m of dailyMetrics) {
    const existing = byDate.get(m.date) || {
      date: m.date,
      reach: 0,
      registrations: 0,
      attendees: 0,
    };
    existing.reach += m.reach || 0;
    existing.registrations += m.registrations || 0;
    existing.attendees += m.attendees || 0;
    byDate.set(m.date, existing);
  }
  const dailyTrend = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let cumRegs = 0;
  const cumulativeTrend = dailyTrend.map((d) => {
    cumRegs += d.registrations;
    return {
      ...d,
      cumulative_registrations: cumRegs,
      projected_cumulative_attendees: Math.round(cumRegs * showUpRate),
    };
  });

  // Festival date Dec 22, 2026 relative to current date or campaign window
  const festivalDate = new Date("2026-12-22T00:00:00+05:30");
  const now = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    totalReach,
    totalRegs: totalRegsFromCampaigns,
    totalTargetRegs,
    projectedAttendees,
    showUpRatePct: 67,
    reachToRegPct,
    totalBudgetAllocated,
    totalBudgetSpent,
    budgetRemaining: Math.max(0, totalBudgetAllocated - totalBudgetSpent),
    blendedCpr,
    reachBase,
    regBase,
    attBase,
    attStretch,
    daysLeft,
    dailyTrend: cumulativeTrend,
    diagnostics: diagnoseCampaigns(campaigns, dailyMetrics),
  };
}
