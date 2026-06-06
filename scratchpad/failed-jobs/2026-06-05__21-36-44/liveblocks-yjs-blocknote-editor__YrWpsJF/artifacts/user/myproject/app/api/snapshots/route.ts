import { NextRequest, NextResponse } from "next/server";

// In-memory snapshot store: roomId → blocks array
const snapshots = new Map<string, unknown[]>();

export async function POST(request: NextRequest) {
  let body: { roomId?: string; blocks?: unknown[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { roomId, blocks } = body;

  if (!roomId || typeof roomId !== "string") {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }
  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "blocks must be an array" }, { status: 400 });
  }

  snapshots.set(roomId, blocks);

  return NextResponse.json(
    { ok: true, roomId, blockCount: blocks.length },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId query param is required" }, { status: 400 });
  }

  const blocks = snapshots.get(roomId);
  if (blocks === undefined) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ roomId, blocks }, { status: 200 });
}
