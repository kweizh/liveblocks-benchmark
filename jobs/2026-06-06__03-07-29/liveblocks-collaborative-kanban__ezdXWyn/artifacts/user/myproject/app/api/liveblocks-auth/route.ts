import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).substring(2, 9)}`
  );

  // Grant full access to rooms whose id starts with "kanban-"
  session.allow("kanban-*", session.FULL_ACCESS);

  const { status, body } = await session.authorize();

  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}