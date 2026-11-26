"use client";

interface FunnelChartProps {
  totalReach: number;
  reachBase: number;
  totalRegs: number;
  regBase: number;
  projectedAttendees: number;
  attBase: number;
  attStretch: number;
}

export function FunnelChart({
  totalReach,
  reachBase,
  totalRegs,
  regBase,
  projectedAttendees,
  attBase,
  attStretch,
}: FunnelChartProps) {
  const reachToReg =
    totalReach > 0 ? ((totalRegs / totalReach) * 100).toFixed(1) : "0.0";
  const regToAtt =
    totalRegs > 0 ? ((projectedAttendees / totalRegs) * 100).toFixed(1) : "0.0";

  const stages = [
    {
      label: "1. Total Reach",
      actual: totalReach,
      target: reachBase,
      widthPct: Math.min(100, Math.max(12, (totalReach / Math.max(reachBase, 1)) * 100)),
      color: "bg-indigo-600",
      note: `Base target: ${reachBase.toLocaleString("en-IN")}`,
    },
    {
      label: "2. Registrations",
      actual: totalRegs,
      target: regBase,
      widthPct: Math.min(100, Math.max(10, (totalRegs / Math.max(regBase, 1)) * 100)),
      color: "bg-violet-600",
      note: `${reachToReg}% of reach | Target: ${regBase.toLocaleString("en-IN")}`,
    },
    {
      label: "3. Projected Attendees (67% show-up)",
      actual: projectedAttendees,
      target: attBase,
      widthPct: Math.min(
        100,
        Math.max(8, (projectedAttendees / Math.max(attBase, 1)) * 100)
      ),
      color: "bg-emerald-600",
      note: `${regToAtt}% show-up | Base: ${attBase.toLocaleString("en-IN")} | Stretch: ${attStretch.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Conversion Funnel (Actual vs Base Target)
          </h2>
          <p className="text-xs text-slate-500">
            Reach → Registrations → Projected Attendees (Mumbai Base: 10,000 | Stretch: 18,000)
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {((projectedAttendees / Math.max(attBase, 1)) * 100).toFixed(1)}% of Base Goal
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {stages.map((s) => {
          const pct = ((s.actual / Math.max(s.target, 1)) * 100).toFixed(1);
          return (
            <div key={s.label} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{s.label}</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    {s.actual.toLocaleString("en-IN")}
                  </span>
                  <span className="ml-1.5 text-xs text-slate-500">
                    / {s.target.toLocaleString("en-IN")} ({pct}%)
                  </span>
                </div>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-lg bg-slate-100">
                <div
                  className={`h-full rounded-lg transition-all ${s.color}`}
                  style={{ width: `${s.widthPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{s.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
