import { NextResponse } from "next/server";
import { Block } from "@blocknote/core";

// In-memory store for snapshots
const snapshots = new Map<string, Block[]>();

export async function POST(request: Request) {
  try {
    const { roomId, blocks } = await request.json();

    if (!roomId || !blocks) {
      return NextResponse.json({ error: "Missing roomId or blocks" }, { status: 400 });
    }

    snapshots.set(roomId, blocks);

    return NextResponse.json({
      ok: true,
      roomId,
      blockCount: blocks.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  const blocks = snapshots.get(roomId);

  if (!blocks) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    roomId,
    blocks,
  });
}
