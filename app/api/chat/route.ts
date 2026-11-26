import { NextResponse } from "next/server";
import { runGrowthAnalystChat } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await runGrowthAnalystChat({
      message,
      conversationHistory: Array.isArray(body?.conversationHistory)
        ? body.conversationHistory
        : [],
      previousInteractionId: body?.previousInteractionId || null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to process AI chat request";
    const status = msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
