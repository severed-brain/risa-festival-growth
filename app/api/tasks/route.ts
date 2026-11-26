import { NextResponse } from "next/server";
import { createTask, getStoreSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await getStoreSnapshot();
    return NextResponse.json({ mode: snapshot.mode, tasks: snapshot.tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    const created = await createTask(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 }
    );
  }
}
