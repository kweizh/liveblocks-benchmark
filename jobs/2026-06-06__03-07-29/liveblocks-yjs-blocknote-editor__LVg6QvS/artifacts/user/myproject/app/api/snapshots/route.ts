import { NextRequest, NextResponse } from "next/server";

// In-memory snapshot store
const snapshots = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, blocks } = body;

    if (!roomId || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "Invalid request: roomId and blocks are required" },
        { status: 400 }
      );
    }

    snapshots.set(roomId, blocks);

    return NextResponse.json({
      ok: true,
      roomId,
      blockCount: blocks.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json(
      { error: "roomId query parameter is required" },
      { status: 400 }
    );
  }

  const blocks = snapshots.get(roomId);

  if (!blocks) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ roomId, blocks });
}