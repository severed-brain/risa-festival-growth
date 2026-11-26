export type CampaignStatus = "active" | "paused" | "stopped";
export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
export type TaskPriority = "high" | "medium" | "low";

export interface Campaign {
  id: string;
  name: string;
  channel: string | null;
  status: CampaignStatus;
  budget_allocated: number;
  budget_spent: number;
  target_registrations: number;
  actual_registrations: number;
  start_date: string | null;
  end_date: string | null;
  owner: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DailyMetric {
  id: string;
  date: string;
  campaign_id: string;
  reach: number;
  registrations: number;
  attendees: number;
  cost_per_registration: number | null;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  campaign_id: string | null;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FunnelTarget {
  id: string;
  metric: "reach" | "registrations" | "attendees" | string;
  base_target: number;
  stretch_target: number;
  current_actual: number;
  updated_at?: string;
}

export interface StoreSnapshot {
  mode: "supabase" | "local";
  campaigns: Campaign[];
  daily_metrics: DailyMetric[];
  tasks: TaskItem[];
  funnel_targets: FunnelTarget[];
}

export interface ActionProposal {
  action: "create_task" | "update_campaign" | "reallocate_budget";
  details: Record<string, unknown>;
}
