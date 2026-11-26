"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  date: string;
  registrations: number;
  cumulative_registrations: number;
  projected_cumulative_attendees: number;
}

export function DailyTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Daily & Cumulative Registration Velocity
          </h2>
          <p className="text-xs text-slate-500">
            21-day Mumbai campaign trajectory (Dec 1 – Dec 21, 2026)
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => String(v).slice(5)}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                borderColor: "#e2e8f0",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="registrations"
              name="Daily Regs"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative_registrations"
              name="Cumulative Regs"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
