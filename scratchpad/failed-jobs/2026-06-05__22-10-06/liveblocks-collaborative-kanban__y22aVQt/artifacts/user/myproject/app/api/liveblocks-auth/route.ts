import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const session = liveblocks.prepareSession(
    `user-${Math.floor(Math.random() * 1000)}`,
    { userInfo: {} } // Optional user info
  );

  // Grant full access to rooms whose id starts with "kanban-"
  session.allow("kanban-*", session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new NextResponse(body, { status });
}
