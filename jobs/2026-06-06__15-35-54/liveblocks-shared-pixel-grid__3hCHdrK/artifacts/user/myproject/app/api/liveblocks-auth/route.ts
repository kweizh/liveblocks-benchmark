import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dummy_secret_for_build_purposes",
});

export async function POST(request: NextRequest) {
  try {
    const { room } = await request.json();

    const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || process.env.ZEALT_RUN_ID;
    const expectedRoomId = `pixel-grid-${runId}`;

    if (!room || room !== expectedRoomId) {
      return new NextResponse("Forbidden: Access to other rooms is not allowed", { status: 403 });
    }

    // Prepare a session for an anonymous user
    const session = liveblocks.prepareSession(
      `user-${Math.random().toString(36).substring(2, 8)}`,
      {
        userInfo: {
          name: "Anonymous User",
        },
      }
    );

    // Grant write access (FULL_ACCESS) to the current room only
    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
