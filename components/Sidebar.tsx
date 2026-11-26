"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CheckSquare,
  Database,
  Megaphone,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/chat", label: "AI Analyst", icon: Bot },
];

export function Sidebar({ mode }: { mode?: "supabase" | "local" }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col justify-between border-b border-slate-200 bg-slate-950 text-slate-100 md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div>
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              Festival Growth
            </p>
            <p className="text-xs text-slate-400">Mumbai • Dec 22, 2026</p>
          </div>
        </div>

        <nav className="flex flex-row gap-1 overflow-x-auto px-3 py-3 md:flex-col md:py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden border-t border-slate-800 p-4 md:block">
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              {mode === "supabase" ? "Supabase Connected" : "Local Preview Store"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            {mode === "supabase"
              ? "Persistent cloud sync enabled."
              : "Persisting to local_store.json. Add Supabase keys in .env.local for cloud DB."}
          </p>
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Challenge A • Attendee Growth
          <br />
          Base: 10,000 | Stretch: 18,000
        </div>
      </div>
    </aside>
  );
}
