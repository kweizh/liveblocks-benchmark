import { NextResponse } from "next/server";

// In-memory store for snapshots
const snapshotsStore = new Map<string, any[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, blocks } = body;

    if (!roomId || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "Invalid request payload. roomId and blocks array are required." },
        { status: 400 }
      );
    }

    snapshotsStore.set(roomId, blocks);

    return NextResponse.json({
      ok: true,
      roomId,
      blockCount: blocks.length,
    });
  } catch (error) {
    console.error("Error in POST /api/snapshots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId query parameter is required." },
        { status: 400 }
      );
    }

    const blocks = snapshotsStore.get(roomId);

    if (!blocks) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      roomId,
      blocks,
    });
  } catch (error) {
    console.error("Error in GET /api/snapshots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
