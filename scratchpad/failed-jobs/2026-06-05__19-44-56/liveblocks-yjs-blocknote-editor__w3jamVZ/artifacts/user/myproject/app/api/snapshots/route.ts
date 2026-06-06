import { NextResponse } from "next/server";

const snapshotsStore = new Map<string, any[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, blocks } = body;
    
    if (!roomId || !blocks) {
      return NextResponse.json({ error: "Missing roomId or blocks" }, { status: 400 });
    }
    
    snapshotsStore.set(roomId, blocks);
    
    return NextResponse.json({ ok: true, roomId, blockCount: blocks.length }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  
  const blocks = snapshotsStore.get(roomId);
  
  if (!blocks) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  
  return NextResponse.json({ roomId, blocks }, { status: 200 });
}
