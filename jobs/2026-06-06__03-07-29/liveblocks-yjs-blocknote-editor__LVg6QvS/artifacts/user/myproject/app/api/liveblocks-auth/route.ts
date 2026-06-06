import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(request: NextRequest) {
  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not set" },
      { status: 500 }
    );
  }

  const liveblocks = new Liveblocks({ secret: SECRET_KEY });

  const body = await request.json();
  const room = body.room as string | undefined;
  const userInfo = body.userInfo as
    | { name?: string; color?: string }
    | undefined;

  // Create a session for an anonymous user
  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: userInfo?.name ?? "Anonymous",
      color: userInfo?.color ?? "#0d9488",
    },
  });

  // Allow full access to the requested room (or a default room)
  const roomId = room || "blocknote-default";
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: authBody } = await session.authorize();

  return new Response(authBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}