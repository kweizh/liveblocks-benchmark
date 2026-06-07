import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // Create a Liveblocks session for this user
  const session = liveblocks.prepareSession(`user-${Math.random().toString(36).slice(2)}`, {
    userInfo: {},
  });

  // Get the room id from the request body
  const { room } = await request.json();

  // Allow the user to enter the requested room
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
