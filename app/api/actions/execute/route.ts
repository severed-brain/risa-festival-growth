import { NextResponse } from "next/server";
import { createTask, reallocateBudget, updateCampaign } from "@/lib/store";
import { ActionProposal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const proposal: ActionProposal = await req.json();
    const { action, details } = proposal;

    if (action === "create_task") {
      const created = await createTask({
        campaign_id:
          typeof details.campaign_id === "string" && details.campaign_id !== "null"
            ? details.campaign_id
            : null,
        title: String(details.title || "Follow up on AI recommendation"),
        owner: String(details.owner || "Growth Team"),
        due_date: details.due_date ? String(details.due_date) : null,
        priority:
          details.priority === "high" ||
          details.priority === "medium" ||
          details.priority === "low"
            ? details.priority
            : "medium",
        status: "pending",
        notes: details.notes ? String(details.notes) : "Created via AI Copilot",
      });
      return NextResponse.json({ ok: true, action, result: created });
    }

    if (action === "update_campaign") {
      const campaignId = String(details.campaign_id || "");
      if (!campaignId) {
        return NextResponse.json(
          { error: "campaign_id is required" },
          { status: 400 }
        );
      }
      const updates: Record<string, unknown> = {};
      if (details.status) updates.status = details.status;
      if (details.budget_allocated !== undefined)
        updates.budget_allocated = Number(details.budget_allocated);
      if (details.target_registrations !== undefined)
        updates.target_registrations = Number(details.target_registrations);
      if (details.notes) updates.notes = String(details.notes);

      const updated = await updateCampaign(campaignId, updates);
      return NextResponse.json({ ok: true, action, result: updated });
    }

    if (action === "reallocate_budget") {
      const fromId = String(details.from_campaign_id || "");
      const toId = String(details.to_campaign_id || "");
      const amount = Number(details.amount_inr || 0);
      const res = await reallocateBudget(fromId, toId, amount);
      return NextResponse.json({ ok: true, action, result: res });
    }

    return NextResponse.json(
      { error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute action" },
      { status: 500 }
    );
  }
}
