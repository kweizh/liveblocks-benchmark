import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // Get the user name from the request body (sent by LiveblocksProvider)
  // We'll allow all requests through for this collaborative form
  const { room } = await request.json();

  const session = liveblocks.prepareSession(`user-${Math.random().toString(36).slice(2, 9)}`, {
    userInfo: {
      name: "Anonymous",
    },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
