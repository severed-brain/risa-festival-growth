import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string;
  sublabel: string;
  progressPct?: number;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  icon?: ReactNode;
}

const ACCENT_BAR: Record<NonNullable<KPICardProps["accent"]>, string> = {
  indigo: "bg-indigo-600",
  emerald: "bg-emerald-600",
  amber: "bg-amber-500",
  rose: "bg-rose-600",
  slate: "bg-slate-600",
};

export function KPICard({
  label,
  value,
  sublabel,
  progressPct,
  accent = "indigo",
  icon,
}: KPICardProps) {
  const clamped =
    progressPct !== undefined ? Math.min(100, Math.max(0, progressPct)) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
      {clamped !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${ACCENT_BAR[accent]}`}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
