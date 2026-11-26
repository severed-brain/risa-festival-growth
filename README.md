# RISA Festival Growth Center — README

- **Author**: Himansu Sekhar Sethy (Roll No: `22CH30048`)
- **Challenge**: Challenge A — Attendee Growth
- **City**: Mumbai (Mumbai Metropolitan Region)
- **Why Mumbai**: 800+ colleges across MMR, established college festival culture (Mood Indigo at IIT-B, Malhar at St. Xavier's, Umang at NM), high 18–24 social media penetration, and strong local transport connectivity across college clusters.

---

## Assumptions
- **Festival Date**: December 22, 2026
- **Campaign Window**: 21 days (December 1 – December 21, 2026; Ticket Split opens Nov 28)
- **Targets**:
  - **Base Target**: 10,000 actual attendees (from 15,000 registrations and 83,000 reach)
  - **Stretch Target**: 18,000 actual attendees (from 27,000 registrations and 150,000 reach; venue ceiling 20,000)
- **Show-up Rate**: **67%** (base case assumption for mixed free/paid college festivals; historical benchmark from `Attendee Dataset.xlsx` / CampusFest 2025 was 2,050 verified external visitors from 2,800 external registrations = 73.2% inclusive of walk-ins, or 68.8% registered-only check-ins)
- **Data Sources**:
  1. **Live Campaign Workspace**: Simulated 21-day Mumbai Dec 2026 dataset seeded via `scripts/seed_data.py` into Supabase (or `data/local_store.json` in local preview mode).
  2. **Original Provided Dataset (`Attendee Dataset.xlsx`)**: CampusFest 2025 historical records (Jan 15 – Apr 20, 2025) deduplicated and preserved in `data/attendee_dataset_summary.json` for benchmark comparison and evaluator chatbot testing.

---

## Detailed Calculations & Funnel Model

### 1. Audience Segments (Base Case)
| Segment | Addressable Pool | Assumed Conversion | Projected Attendees |
|---|---:|---:|---:|
| Tier 1 — Host college students | ~3,000 | 70% | 2,100 |
| Tier 2 — Partner college students (40 colleges) | ~20,000 | 25% | 5,000 |
| Tier 3 — General youth (18–24, Mumbai) | ~50,000 | 4% | 2,000 |
| Tier 4 — Alumni & young professionals | ~10,000 | 5% | 500 |
| **Total** | **83,000** | **~11.6% net** | **~9,600 (10,000 Base)** |

### 2. Core Funnel Math
- **Reach**: 83,000 (Base) / 150,000 (Stretch)
- **Registrations**: 15,000 (18.1% of reach, Base) / 27,000 (Stretch)
- **Actual Attendees**: 10,000 (66.7% show-up, Base) / 18,000 (Stretch)

### 3. Five Ranked Strategies & Campaign Budgets
| Rank | Strategy | Owner | Budget (₹) | Target Regs | Timeline |
|---|---|---|---:|---:|---|
| 1 | Campus Ambassador Program (40 colleges × 150 regs) | Riya | ₹40,000 | 6,000 | Dec 1 – Dec 21 |
| 2 | Instagram Reel Contest (UGC viral loop) | Aryan | ₹15,000 | 2,000 | Dec 7 – Dec 21 |
| 3 | Free + Paid Ticket Split (60% free / 40% ₹199 pass) | Priya | ₹0 | 3,000 | Nov 28 – Dec 21 |
| 4 | College Club Tie-ups (>20 member group perks) | Kunal | ₹10,000 | 2,500 | Dec 1 – Dec 14 |
| 5 | Countdown Email + WhatsApp Drip (7-day reminder) | Meera | ₹5,000 | 1,500 | Dec 14 – Dec 21 |
| **Total** | **5 Active Campaigns** | — | **₹70,000** | **15,000** | — |

*Note on Total Acquisition Envelope (~₹1,75,000):* Direct campaign execution takes ₹70,000 above; remaining promotional envelope covers paid Meta/Instagram reach amplification (~₹1.5/reach × 83,000 = ₹1,24,500 scaled with organic share) and contingency offline campus collateral (₹20,000) when pushing toward stretch targets.

*Deprioritized Channels:* Paid OOH billboards (high cost, poor attribution) and LinkedIn ads (wrong demographic for college fest).

---

## Historical Dataset Reference (`Attendee Dataset.xlsx` — CampusFest 2025)
To preserve the original dataset for chatbot testing and verification:
- **Deduplication applied per Read me**: `Daily Marketing` (483 → 481 rows by `activity_id`), `Registration History` (5,911 → 5,907 by `history_id`), `Check-ins` (3,390 → 3,370 by `event_id`).
- **Observed Totals**: 3,685 people (3,625 external, 40 internal, 10 staff, 10 test), 2,800 distinct external registered people (2,500 confirmed, 183 cancelled, 88 waitlisted, 29 interested), 2,050 distinct verified admitted external visitors (including 125 unattributed walk-ins), ₹2,74,000 net marketing spend (₹97.86 blended CPR, ₹133.66 CPV).
- **Best Historical Efficiency**: Student Referrals (₹54.29 CPR, ₹69.09 CPV) and College Partnerships (85.6% show-up rate, ₹80.52 CPV).

---

## Tools, Plans & Sources
- **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS** (MIT/open-source) — frontend & API routes
- **Supabase PostgreSQL (Free Tier)** — persistent storage for `campaigns`, `daily_metrics`, `tasks`, and `funnel_targets` (with automatic fallback to `data/local_store.json` when Supabase env vars are omitted)
- **Google Gemini API (`@google/genai` SDK + `gemini-3.8-flash`, Google AI Studio Free Tier)** — embedded AI Growth Analyst & Copilot (*substituted for legacy `@google/generative-ai` / `gemini-2.0-flash` which are deprecated*)
- **Recharts** + **Lucide React** (open-source) — funnel & trend visualizations and icons
- **Python 3.11 + openpyxl + PyMuPDF + Headless Chrome** — `Attendee Dataset.xlsx` ETL (`export_summary.py`), campaign seed script (`scripts/seed_data.py`), and 3-slide PDF export (`slides/build_slides.py`)
- **Vercel (Hobby / Free Tier)** — web app deployment target
- **Data Sources**:
  - Provided historical dataset: `C:\RISA LABS\Datasets\Attendee Dataset.xlsx` (`CampusFest 2025`, synthetic) — deduplicated, verified, and summarized into `data/attendee_dataset_summary.json`
  - Live campaign workspace: simulated Mumbai Dec 2026 metrics generated by `scripts/seed_data.py`

### What Was Verified
- Production build (`npm run build`) with TypeScript and ESLint checks
- End-to-end CRUD persistence for campaigns and tasks, automatic funnel target recalculation, and action execution (`/api/actions/execute`)
- Visual verification of the running dashboard and all 3 rendered slides in `RISA_Growth_APM_Strategy_Slides.pdf`
- Missing-key safety guard on `/api/chat` (returns HTTP 503 when `GEMINI_API_KEY` is unset; live Gemini responses require adding your API key in `.env.local`)

---

## Setup Instructions

1. **Install dependencies**:
   ```bash
   cd festival-growth-center
   npm install
   ```
2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (from Google AI Studio)
3. **Set up Supabase schema**:
   - Paste and run `supabase/schema.sql` in your Supabase SQL Editor.
4. **Seed data**:
   ```bash
   python scripts/seed_data.py
   ```
   *(Pass `--local` or omit Supabase keys to seed `data/local_store.json` for offline local testing.)*
5. **Run locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Known Limitations
- The AI chatbot injects structured live summaries + the latest 35 daily rows + aggregated `CampusFest 2025` metrics into `system_instruction` rather than running live SQL queries, so individual person-level row lookups (e.g. searching a single person ID out of 3,685 rows) are not indexed in the prompt context.
- Dashboard auto-refreshes via 30-second polling and immediately on mutations rather than WebSocket subscriptions.
- Live Mumbai Dec 2026 numbers are simulated (`seed_data.py`) rather than pulled from a live ticketing webhook.

---

## Chatbot Testing Guide (10 Evaluator Test Questions)
1. *"Which live Mumbai campaign has the best cost per registration?"*
2. *"What is our projected final attendance at current pace vs our 10,000 base target?"*
3. *"Which campaign is furthest behind target right now and what should we do?"*
4. *"Create a high-priority task for Kunal to push College Club Tie-ups before Dec 14."* (Tests insight-to-action execution with user confirmation)
5. *"Reallocate ₹5,000 from Instagram Reel Contest to Campus Ambassador Program."* (Tests budget reallocation confirmation)
6. *"In the historical CampusFest 2025 dataset, which campaign had the lowest cost per verified visitor?"*
7. *"In CampusFest 2025, how many external people registered vs actually attended (verified), and how many were walk-ins?"*
8. *"Why shouldn't we sum `reported_reach` across days in CampusFest 2025?"*
9. *"If show-up rate on our Mumbai campaign drops from 67% to 55%, how many attendees do we project?"*
10. *"What is the weather forecast for Mumbai on December 22, or how much revenue did CampusFest 2025 earn from VIP tickets?"* (Tests honest uncertainty handling — bot should state the data does not support an answer.)
