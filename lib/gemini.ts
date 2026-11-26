import { GoogleGenAI } from "@google/genai";
import historicalDataset from "@/data/attendee_dataset_summary.json";
import { getStoreSnapshot } from "./store";
import { computeDashboardSummary, STRATEGY_THRESHOLDS } from "./analytics";
import { ActionProposal } from "./types";

export function getHistoricalDataset() {
  return historicalDataset;
}

export async function buildSystemPrompt(): Promise<string> {
  const snapshot = await getStoreSnapshot();
  const summary = computeDashboardSummary(
    snapshot.campaigns,
    snapshot.daily_metrics,
    snapshot.funnel_targets
  );
  const historical = getHistoricalDataset();

  const recentMetrics = [...snapshot.daily_metrics]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 35);

  return `You are the AI Growth Analyst & Copilot for a college festival attendee acquisition campaign in Mumbai.
You have access to TWO real datasets:
1) LIVE CAMPAIGN DATA (Mumbai Dec 2026 Command Center — campaigns, targets, daily metrics, tasks). Note that edits made in the dashboard immediately update this live snapshot.
2) PROVIDED HISTORICAL DATASET (CampusFest 2025 — from Attendee Dataset.xlsx, Jan 15 to Apr 20, 2025).

Always check BOTH datasets carefully depending on what the user asks. Clearly state which dataset (Live Mumbai Dec 2026 vs Historical CampusFest 2025) your numbers come from, and distinguish verified data from assumptions.

=== LIVE MUMBAI DEC 2026 SUMMARY ===
Storage mode: ${snapshot.mode}
Total Reach: ${summary.totalReach}
Total Registrations: ${summary.totalRegs} (Target sum: ${summary.totalTargetRegs})
Projected Attendees (67% show-up benchmark): ${summary.projectedAttendees} (Base Goal: ${summary.attBase}, Stretch Goal: ${summary.attStretch})
Budget Allocated: ₹${summary.totalBudgetAllocated} | Budget Spent: ₹${summary.totalBudgetSpent} | Blended CPR: ₹${summary.blendedCpr}

LIVE FUNNEL TARGETS:
${JSON.stringify(snapshot.funnel_targets, null, 2)}

LIVE CAMPAIGNS (with diagnostics):
${JSON.stringify(
  snapshot.campaigns.map((c) => {
    const diag = summary.diagnostics.find((d) => d.campaignId === c.id);
    return { ...c, diagnostics: diag };
  }),
  null,
  2
)}

LIVE STRATEGY THRESHOLDS (Slide 3 Rules):
${JSON.stringify(STRATEGY_THRESHOLDS, null, 2)}

RECENT LIVE DAILY METRICS (latest 35 rows):
${JSON.stringify(recentMetrics, null, 2)}

ALL LIVE TASKS:
${JSON.stringify(snapshot.tasks, null, 2)}

=== HISTORICAL DATASET: CampusFest 2025 (Attendee Dataset.xlsx) ===
${historical ? JSON.stringify(historical, null, 2) : "Not available."}

=== STRICT OPERATING RULES ===
1. Base EVERY numeric claim strictly on the data above. Show your calculation steps clearly when computing rates, CPR, CPV, or projections. Never invent numbers.
2. Distinguish evidence (observed actuals) from assumptions (e.g. 67% projected show-up rate on live Mumbai campaign).
3. Handle uncertainty honestly: If a question asks about metrics not present in either dataset (e.g., Mumbai weather, ticket revenue amounts, sponsor deals, per-college breakdown in the live table, post-April 20 2025 unrecorded dates, etc.), explicitly state: "The current data doesn't support a confident answer to this." and explain specifically what data field is missing.
4. Note on Historical CampusFest 2025 caveats:
   - Historical targets apply to EXTERNAL people only (3,625 external out of 3,685 total people; 40 internal, 10 staff, 10 test).
   - Platform reported_reach is daily-only without cross-day deduplication; summing reported_reach does NOT equal unique people.
   - Check-in attendance counts distinct external people with result="admitted" AND verification="verified" (2,050 verified external visitors, including 125 unattributed walk-ins).
5. When recommending an executable action (creating a task, updating a campaign status/target/budget, or reallocating budget between two campaigns), append an action block on its own line at the very end using valid JSON so the user can confirm and execute it with one click:
ACTION: create_task | DETAILS: {"campaign_id":"<exact-uuid-or-null>","title":"<short title>","owner":"<owner>","due_date":"YYYY-MM-DD","priority":"high|medium|low","notes":"<reason>"}
OR
ACTION: update_campaign | DETAILS: {"campaign_id":"<exact-uuid>","status":"active|paused|stopped","budget_allocated":<number>,"target_registrations":<number>,"notes":"<reason>"}
OR
ACTION: reallocate_budget | DETAILS: {"from_campaign_id":"<uuid>","to_campaign_id":"<uuid>","amount_inr":<number>}
Only emit ACTION when genuinely recommending a concrete change in the live Mumbai Growth Center.
6. Be concise, structured, analytical, and actionable.`;
}

export function extractActionProposals(text: string): ActionProposal[] {
  const proposals: ActionProposal[] = [];
  const regex = /ACTION:\s*(create_task|update_campaign|reallocate_budget)\s*\|\s*DETAILS:\s*(\{[^\n]*\})/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    try {
      const details = JSON.parse(match[2]);
      proposals.push({
        action: match[1] as ActionProposal["action"],
        details,
      });
    } catch {
      // Ignore malformed action JSON
    }
  }
  return proposals;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function runGrowthAnalystChat(params: {
  message: string;
  conversationHistory?: ChatTurn[];
  previousInteractionId?: string | null;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add GEMINI_API_KEY in .env.local to use the AI Growth Analyst."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { retryOptions: { attempts: 1 } },
  });
  const systemInstruction = await buildSystemPrompt();

  const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

  // Prefer server-side stateful chaining via previous_interaction_id when available,
  // falling back to inline conversation transcript or fallback model on 503/429 spikes.
  const callModel = async (model: string, usePrevId: boolean) => {
    const historyTranscript =
      !usePrevId && params.conversationHistory && params.conversationHistory.length > 0
        ? `Previous conversation context:\n${params.conversationHistory
            .slice(-8)
            .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
            .join("\n")}\n\nLatest user message:\n${params.message}`
        : params.message;

    return ai.interactions.create(
      {
        model,
        input: historyTranscript,
        system_instruction: systemInstruction,
        ...(usePrevId && params.previousInteractionId
          ? { previous_interaction_id: params.previousInteractionId }
          : {}),
      },
      { retries: { strategy: "none" }, timeout_ms: 20000 }
    );
  };

  let interaction;
  let modelUsed = modelsToTry[0];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    modelUsed = model;
    try {
      try {
        interaction = await callModel(model, Boolean(params.previousInteractionId));
      } catch (err) {
        if (params.previousInteractionId) {
          interaction = await callModel(model, false);
        } else {
          throw err;
        }
      }
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("service_unavailable") ||
        msg.includes("high demand") ||
        msg.includes("too_many_requests");
      if (!isTransient) throw err;
    }
  }

  if (!interaction) {
    throw lastError instanceof Error
      ? lastError
      : new Error("All Gemini models temporarily unavailable.");
  }

  const reply = interaction.output_text || "No response text returned from Gemini.";
  const actions = extractActionProposals(reply);

  return {
    reply,
    interactionId: interaction.id,
    modelUsed,
    actions,
  };
}
