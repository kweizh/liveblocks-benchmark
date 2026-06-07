import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(request: Request) {
  if (!secret) {
    return NextResponse.json(
      { error: "Missing LIVEBLOCKS_SECRET_KEY" },
      { status: 500 }
    );
  }

  let body: { room?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const room = typeof body?.room === "string" ? body.room : "*";

  const liveblocks = new Liveblocks({ secret });
  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).slice(2, 10)}`,
    { userInfo: { name: "anonymous" } }
  );
  // Allow the requested room (or wildcard to cover all rooms)
  session.allow(room, session.FULL_ACCESS);
  // Also allow the run-id-derived room in case it differs
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;
  if (runId && room !== `cursor-positions-${runId}`) {
    session.allow(`cursor-positions-${runId}`, session.FULL_ACCESS);
  }
  // Wildcard to allow any cursor-positions-* room
  session.allow("cursor-positions-*", session.FULL_ACCESS);

  const { status, body: tokenBody } = await session.authorize();
  return new NextResponse(tokenBody, {
    status,
    headers: { "content-type": "application/json" },
  });
}
