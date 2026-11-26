"""
seed_data.py — Populate daily_metrics (21 days), update campaign actuals/spend,
update funnel_targets, and seed starter tasks.

Supports:
1) Supabase REST API (default when SUPABASE_URL & SUPABASE_ANON_KEY are in .env.local or env)
2) Local preview store (--local flag or automatic fallback to data/local_store.json)
"""

import argparse
from datetime import date, timedelta
import json
import os
from pathlib import Path
import random
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parent.parent
LOCAL_STORE_PATH = ROOT / "data" / "local_store.json"

DEFAULT_FUNNEL_TARGETS = [
    {
        "metric": "reach",
        "base_target": 83000,
        "stretch_target": 150000,
        "current_actual": 0,
    },
    {
        "metric": "registrations",
        "base_target": 15000,
        "stretch_target": 27000,
        "current_actual": 0,
    },
    {
        "metric": "attendees",
        "base_target": 10000,
        "stretch_target": 18000,
        "current_actual": 0,
    },
]

DEFAULT_CAMPAIGNS = [
    {
        "name": "Campus Ambassador Program",
        "channel": "ambassador",
        "status": "active",
        "budget_allocated": 40000,
        "budget_spent": 0,
        "target_registrations": 6000,
        "actual_registrations": 0,
        "start_date": "2026-12-01",
        "end_date": "2026-12-21",
        "owner": "Riya",
        "notes": "1 ambassador per college x 40 Mumbai colleges; target 150 regs/ambassador",
    },
    {
        "name": "Instagram Reel Contest",
        "channel": "instagram",
        "status": "active",
        "budget_allocated": 15000,
        "budget_spent": 0,
        "target_registrations": 2000,
        "actual_registrations": 0,
        "start_date": "2026-12-07",
        "end_date": "2026-12-21",
        "owner": "Aryan",
        "notes": "UGC Reel campaign: Show your festival look, win free passes",
    },
    {
        "name": "Free/Paid Ticket Split",
        "channel": "direct",
        "status": "active",
        "budget_allocated": 0,
        "budget_spent": 0,
        "target_registrations": 3000,
        "actual_registrations": 0,
        "start_date": "2026-11-28",
        "end_date": "2026-12-21",
        "owner": "Priya",
        "notes": "60% free general passes (email gate), 40% paid Rs 199 premium passes",
    },
    {
        "name": "College Club Tie-ups",
        "channel": "clubs",
        "status": "active",
        "budget_allocated": 10000,
        "budget_spent": 0,
        "target_registrations": 2500,
        "actual_registrations": 0,
        "start_date": "2026-12-01",
        "end_date": "2026-12-14",
        "owner": "Kunal",
        "notes": "Cultural committees, NSS, student bodies across 40 colleges; >20 group discount",
    },
    {
        "name": "Email/WhatsApp Drip",
        "channel": "email",
        "status": "active",
        "budget_allocated": 5000,
        "budget_spent": 0,
        "target_registrations": 1500,
        "actual_registrations": 0,
        "start_date": "2026-12-14",
        "end_date": "2026-12-21",
        "owner": "Meera",
        "notes": "Automated 7-day countdown drip to boost registrations & reduce show-up drop-off",
    },
]

# Daily pacing profiles matching Step 5 of RISA_APM_Assignment_Plan.md
CHANNEL_PROFILE = {
    "ambassador": {"daily_regs": 200, "daily_reach": 1500, "daily_spend": 1550},
    "instagram": {"daily_regs": 60, "daily_reach": 5000, "daily_spend": 680},
    "direct": {"daily_regs": 100, "daily_reach": 2000, "daily_spend": 0},
    "clubs": {"daily_regs": 80, "daily_reach": 800, "daily_spend": 420},
    "email": {"daily_regs": 50, "daily_reach": 500, "daily_spend": 210},
}


def load_env():
  env_file = ROOT / ".env.local"
  if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
      line = line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      k, v = line.split("=", 1)
      os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def supabase_request(url, key, method, path, body=None, extra_headers=None):
  endpoint = f"{url.rstrip('/')}/rest/v1/{path}"
  headers = {
      "apikey": key,
      "Authorization": f"Bearer {key}",
      "Content-Type": "application/json",
  }
  if extra_headers:
    headers.update(extra_headers)
  data = json.dumps(body).encode("utf-8") if body is not None else None
  req = urllib.request.Request(endpoint, data=data, headers=headers, method=method)
  try:
    with urllib.request.urlopen(req, timeout=20) as resp:
      raw = resp.read().decode("utf-8")
      return json.loads(raw) if raw else None
  except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8", errors="replace")
    raise RuntimeError(f"Supabase {method} {path} failed ({e.code}): {err_body}")


def generate_simulation(campaigns):
  random.seed(42)
  start = date(2026, 12, 1)
  daily_rows = []
  camp_totals = {
      c["id"]: {"regs": 0, "reach": 0, "spend": 0} for c in campaigns
  }

  for i in range(21):  # 21 days of campaign (Dec 1 - Dec 21)
    day = start + timedelta(days=i)
    growth_factor = min(1.0, 0.3 + (i / 21.0) * 0.9)
    for c in campaigns:
      prof = CHANNEL_PROFILE.get(
          c.get("channel") or "direct",
          {"daily_regs": 50, "daily_reach": 500, "daily_spend": 200},
      )
      noise = random.uniform(0.8, 1.2)
      reach = int(prof["daily_reach"] * growth_factor * noise)
      regs = int(prof["daily_regs"] * growth_factor * noise)
      spend = round(prof["daily_spend"] * growth_factor * noise)
      # Cap spend reasonably near allocated budget
      if c["budget_allocated"] == 0:
        spend = 0
      cpr = round(spend / regs, 2) if regs > 0 else 0
      # Projected confirmed/pre-checked attendees (~67% benchmark show-up)
      attendees = round(regs * 0.67)
      daily_rows.append({
          "date": str(day),
          "campaign_id": c["id"],
          "reach": reach,
          "registrations": regs,
          "attendees": attendees,
          "cost_per_registration": cpr,
      })
      camp_totals[c["id"]]["regs"] += regs
      camp_totals[c["id"]]["reach"] += reach
      camp_totals[c["id"]]["spend"] += spend

  return daily_rows, camp_totals


def build_starter_tasks(campaigns):
  by_channel = {c["channel"]: c["id"] for c in campaigns}
  return [
      {
          "campaign_id": by_channel.get("ambassador"),
          "title": "Pilot check-in with top 5 Mumbai college ambassadors",
          "owner": "Riya",
          "due_date": "2026-12-05",
          "status": "done",
          "priority": "high",
          "notes": "Pilot crossed 115 avg regs/ambassador; greenlit rollout to all 40 colleges.",
      },
      {
          "campaign_id": by_channel.get("ambassador"),
          "title": "Onboard 10 additional Tier-2 engineering college ambassadors",
          "owner": "Riya",
          "due_date": "2026-12-12",
          "status": "in_progress",
          "priority": "high",
          "notes": "Target DJ Sanghvi, VJTI, Sardar Patel, KJ Somaiya clusters.",
      },
      {
          "campaign_id": by_channel.get("instagram"),
          "title": "Audit Reel hashtag A/B test (#MumbaiFestLook vs #CampusVibe26)",
          "owner": "Aryan",
          "due_date": "2026-12-10",
          "status": "pending",
          "priority": "high",
          "notes": "Monitor 48h share threshold (500 shares) and registration link CTR.",
      },
      {
          "campaign_id": by_channel.get("clubs"),
          "title": "Finalize bulk discount codes for 15 NSS & cultural committees",
          "owner": "Kunal",
          "due_date": "2026-12-08",
          "status": "pending",
          "priority": "medium",
          "notes": "Clubs >20 members unlock 20% group pass perk before Dec 14 deadline.",
      },
      {
          "campaign_id": by_channel.get("direct"),
          "title": "Configure free-to-Rs.199 paid pass upgrade banner on checkout",
          "owner": "Priya",
          "due_date": "2026-12-04",
          "status": "done",
          "priority": "medium",
          "notes": "60% free / 40% paid ticket split tracking live.",
      },
      {
          "campaign_id": by_channel.get("email"),
          "title": "Set up 7-day WhatsApp & email countdown reminders",
          "owner": "Meera",
          "due_date": "2026-12-13",
          "status": "in_progress",
          "priority": "high",
          "notes": "Target >40% open rate to protect 67% show-up rate.",
      },
  ]


def seed_local():
  campaigns = []
  for c in DEFAULT_CAMPAIGNS:
    campaigns.append({
        "id": str(uuid.uuid4()),
        **c,
        "created_at": "2026-11-26T09:00:00Z",
        "updated_at": "2026-11-26T09:00:00Z",
    })

  daily_rows, camp_totals = generate_simulation(campaigns)
  for row in daily_rows:
    row["id"] = str(uuid.uuid4())
    row["created_at"] = "2026-11-26T09:00:00Z"

  total_reach = 0
  total_regs = 0
  for c in campaigns:
    tot = camp_totals[c["id"]]
    c["actual_registrations"] = tot["regs"]
    c["budget_spent"] = min(c["budget_allocated"], tot["spend"]) if c["budget_allocated"] > 0 else 0
    total_reach += tot["reach"]
    total_regs += tot["regs"]

  projected_attendees = round(total_regs * 0.67)
  funnel_targets = []
  for ft in DEFAULT_FUNNEL_TARGETS:
    actual = (
        total_reach
        if ft["metric"] == "reach"
        else total_regs
        if ft["metric"] == "registrations"
        else projected_attendees
    )
    funnel_targets.append({
        "id": str(uuid.uuid4()),
        **ft,
        "current_actual": actual,
        "updated_at": "2026-11-26T09:00:00Z",
    })

  tasks = []
  for t in build_starter_tasks(campaigns):
    tasks.append({
        "id": str(uuid.uuid4()),
        **t,
        "created_at": "2026-11-26T09:00:00Z",
        "updated_at": "2026-11-26T09:00:00Z",
    })

  store = {
      "campaigns": campaigns,
      "daily_metrics": daily_rows,
      "tasks": tasks,
      "funnel_targets": funnel_targets,
  }
  LOCAL_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
  LOCAL_STORE_PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")
  print(
      f"Seeded local store at {LOCAL_STORE_PATH}: "
      f"{len(campaigns)} campaigns, {len(daily_rows)} daily_metrics, "
      f"{len(tasks)} tasks, {total_regs} total registrations, "
      f"{projected_attendees} projected attendees."
  )


def seed_supabase(url, key):
  campaigns = supabase_request(url, key, "GET", "campaigns?select=*")
  if not campaigns:
    campaigns = supabase_request(
        url,
        key,
        "POST",
        "campaigns",
        body=DEFAULT_CAMPAIGNS,
        extra_headers={"Prefer": "return=representation"},
    )

  # Clear prior daily_metrics so repeated seed runs don't duplicate rows
  supabase_request(url, key, "DELETE", "daily_metrics?id=not.is.null")

  daily_rows, camp_totals = generate_simulation(campaigns)
  supabase_request(url, key, "POST", "daily_metrics", body=daily_rows)

  total_reach = 0
  total_regs = 0
  for c in campaigns:
    tot = camp_totals[c["id"]]
    spent = min(float(c.get("budget_allocated") or 0), tot["spend"])
    supabase_request(
        url,
        key,
        "PATCH",
        f"campaigns?id=eq.{c['id']}",
        body={
            "actual_registrations": tot["regs"],
            "budget_spent": spent,
        },
    )
    total_reach += tot["reach"]
    total_regs += tot["regs"]

  projected_attendees = round(total_regs * 0.67)
  existing_targets = supabase_request(url, key, "GET", "funnel_targets?select=*")
  if not existing_targets:
    supabase_request(url, key, "POST", "funnel_targets", body=DEFAULT_FUNNEL_TARGETS)
    existing_targets = supabase_request(url, key, "GET", "funnel_targets?select=*")

  for ft in existing_targets:
    actual = (
        total_reach
        if ft["metric"] == "reach"
        else total_regs
        if ft["metric"] == "registrations"
        else projected_attendees
    )
    supabase_request(
        url,
        key,
        "PATCH",
        f"funnel_targets?id=eq.{ft['id']}",
        body={"current_actual": actual},
    )

  existing_tasks = supabase_request(url, key, "GET", "tasks?select=id")
  if not existing_tasks:
    supabase_request(url, key, "POST", "tasks", body=build_starter_tasks(campaigns))

  print(
      f"Seeded Supabase: {len(campaigns)} campaigns, {len(daily_rows)} daily_metrics, "
      f"{total_regs} total registrations, {projected_attendees} projected attendees."
  )


if __name__ == "__main__":
  load_env()
  parser = argparse.ArgumentParser()
  parser.add_argument("--local", action="store_true", help="Write to data/local_store.json")
  args = parser.parse_args()

  supa_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supa_key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if args.local or not supa_url or not supa_key:
    if not args.local:
      print("Supabase env vars not set; seeding local preview store instead.")
    seed_local()
  else:
    seed_supabase(supa_url, supa_key)
