import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSupabaseClient } from "./supabase";
import {
  Campaign,
  DailyMetric,
  FunnelTarget,
  StoreSnapshot,
  TaskItem,
} from "./types";

const LOCAL_STORE_FILE = path.join(process.cwd(), "data", "local_store.json");

function readLocalStore(): Omit<StoreSnapshot, "mode"> {
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    return {
      campaigns: [],
      daily_metrics: [],
      tasks: [],
      funnel_targets: [],
    };
  }
  const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeLocalStore(store: Omit<StoreSnapshot, "mode">) {
  fs.mkdirSync(path.dirname(LOCAL_STORE_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function syncLocalFunnelTargets(store: Omit<StoreSnapshot, "mode">) {
  const totalReach = store.daily_metrics.reduce((s, d) => s + (d.reach || 0), 0);
  const totalRegs = store.campaigns.reduce(
    (s, c) => s + (c.actual_registrations || 0),
    0
  );
  const projectedAtt = Math.round(totalRegs * 0.67);
  store.funnel_targets = store.funnel_targets.map((ft) => ({
    ...ft,
    current_actual:
      ft.metric === "reach"
        ? totalReach
        : ft.metric === "registrations"
          ? totalRegs
          : projectedAtt,
    updated_at: new Date().toISOString(),
  }));
}

async function syncSupabaseFunnelTargets() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const [{ data: campaigns }, { data: metrics }, { data: targets }] =
    await Promise.all([
      supabase.from("campaigns").select("actual_registrations"),
      supabase.from("daily_metrics").select("reach"),
      supabase.from("funnel_targets").select("*"),
    ]);

  if (!targets) return;
  const totalReach = (metrics || []).reduce((s, m) => s + (m.reach || 0), 0);
  const totalRegs = (campaigns || []).reduce(
    (s, c) => s + (c.actual_registrations || 0),
    0
  );
  const projectedAtt = Math.round(totalRegs * 0.67);

  await Promise.all(
    targets.map((t) => {
      const nextActual =
        t.metric === "reach"
          ? totalReach
          : t.metric === "registrations"
            ? totalRegs
            : projectedAtt;
      return supabase
        .from("funnel_targets")
        .update({
          current_actual: nextActual,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
    })
  );
}

export async function getStoreSnapshot(): Promise<StoreSnapshot> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const local = readLocalStore();
    return { mode: "local", ...local };
  }

  const [campaignsRes, metricsRes, tasksRes, funnelRes] = await Promise.all([
    supabase.from("campaigns").select("*").order("created_at", { ascending: true }),
    supabase
      .from("daily_metrics")
      .select("*")
      .order("date", { ascending: true }),
    supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    supabase.from("funnel_targets").select("*").order("metric", { ascending: true }),
  ]);

  if (campaignsRes.error) {
    throw new Error(`Supabase read failed: ${campaignsRes.error.message}`);
  }

  return {
    mode: "supabase",
    campaigns: (campaignsRes.data || []) as Campaign[],
    daily_metrics: (metricsRes.data || []) as DailyMetric[],
    tasks: (tasksRes.data || []) as TaskItem[],
    funnel_targets: (funnelRes.data || []) as FunnelTarget[],
  };
}

export async function createCampaign(
  payload: Partial<Campaign>
): Promise<Campaign> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const store = readLocalStore();
    const row: Campaign = {
      id: crypto.randomUUID(),
      name: payload.name || "Untitled Campaign",
      channel: payload.channel || "direct",
      status: payload.status || "active",
      budget_allocated: Number(payload.budget_allocated || 0),
      budget_spent: Number(payload.budget_spent || 0),
      target_registrations: Number(payload.target_registrations || 0),
      actual_registrations: Number(payload.actual_registrations || 0),
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      owner: payload.owner || "Unassigned",
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.campaigns.push(row);
    syncLocalFunnelTargets(store);
    writeLocalStore(store);
    return row;
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      name: payload.name,
      channel: payload.channel,
      status: payload.status || "active",
      budget_allocated: Number(payload.budget_allocated || 0),
      budget_spent: Number(payload.budget_spent || 0),
      target_registrations: Number(payload.target_registrations || 0),
      actual_registrations: Number(payload.actual_registrations || 0),
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      owner: payload.owner || null,
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await syncSupabaseFunnelTargets();
  return data as Campaign;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>
): Promise<Campaign> {
  const supabase = getSupabaseClient();
  const cleanUpdates: Partial<Campaign> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  if (!supabase) {
    const store = readLocalStore();
    const idx = store.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Campaign not found");
    store.campaigns[idx] = {
      ...store.campaigns[idx],
      ...cleanUpdates,
    };
    syncLocalFunnelTargets(store);
    writeLocalStore(store);
    return store.campaigns[idx];
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await syncSupabaseFunnelTargets();
  return data as Campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const store = readLocalStore();
    store.campaigns = store.campaigns.filter((c) => c.id !== id);
    store.daily_metrics = store.daily_metrics.filter((m) => m.campaign_id !== id);
    syncLocalFunnelTargets(store);
    writeLocalStore(store);
    return;
  }

  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await syncSupabaseFunnelTargets();
}

export async function createTask(payload: Partial<TaskItem>): Promise<TaskItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const store = readLocalStore();
    const row: TaskItem = {
      id: crypto.randomUUID(),
      campaign_id: payload.campaign_id || null,
      title: payload.title || "Untitled Task",
      owner: payload.owner || "Team",
      due_date: payload.due_date || null,
      status: payload.status || "pending",
      priority: payload.priority || "medium",
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.tasks.push(row);
    writeLocalStore(store);
    return row;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      campaign_id: payload.campaign_id || null,
      title: payload.title,
      owner: payload.owner || null,
      due_date: payload.due_date || null,
      status: payload.status || "pending",
      priority: payload.priority || "medium",
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TaskItem;
}

export async function updateTask(
  id: string,
  updates: Partial<TaskItem>
): Promise<TaskItem> {
  const supabase = getSupabaseClient();
  const cleanUpdates: Partial<TaskItem> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  delete cleanUpdates.id;

  if (!supabase) {
    const store = readLocalStore();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Task not found");
    store.tasks[idx] = { ...store.tasks[idx], ...cleanUpdates };
    writeLocalStore(store);
    return store.tasks[idx];
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TaskItem;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const store = readLocalStore();
    store.tasks = store.tasks.filter((t) => t.id !== id);
    writeLocalStore(store);
    return;
  }
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reallocateBudget(
  fromCampaignId: string,
  toCampaignId: string,
  amountInr: number
): Promise<{ from: Campaign; to: Campaign }> {
  const snapshot = await getStoreSnapshot();
  const fromCamp = snapshot.campaigns.find((c) => c.id === fromCampaignId);
  const toCamp = snapshot.campaigns.find((c) => c.id === toCampaignId);
  if (!fromCamp || !toCamp) {
    throw new Error("Source or target campaign not found for budget reallocation.");
  }
  const amount = Math.max(0, Number(amountInr));
  const nextFrom = Math.max(0, Number(fromCamp.budget_allocated) - amount);
  const nextTo = Number(toCamp.budget_allocated) + amount;

  const [updatedFrom, updatedTo] = await Promise.all([
    updateCampaign(fromCamp.id, { budget_allocated: nextFrom }),
    updateCampaign(toCamp.id, { budget_allocated: nextTo }),
  ]);

  return { from: updatedFrom, to: updatedTo };
}
