import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // Identify the user — use a random guest id for anonymous access
  const session = liveblocks.prepareSession(`user-${Math.random().toString(36).slice(2)}`, {
    userInfo: {},
  });

  // Grant full access to all rooms whose id starts with "kanban-"
  session.allow("kanban-*", session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
