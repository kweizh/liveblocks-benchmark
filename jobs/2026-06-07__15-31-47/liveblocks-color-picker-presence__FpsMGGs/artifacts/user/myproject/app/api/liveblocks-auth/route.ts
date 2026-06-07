import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // Create a session for the current user
  const session = liveblocks.prepareSession(`user-${Math.random().toString(36).slice(2)}`, {
    userInfo: {},
  });

  const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
