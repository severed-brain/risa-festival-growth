import { NextResponse } from "next/server";
import { createCampaign, getStoreSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await getStoreSnapshot();
    return NextResponse.json({ mode: snapshot.mode, campaigns: snapshot.campaigns });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }
    const created = await createCampaign(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
