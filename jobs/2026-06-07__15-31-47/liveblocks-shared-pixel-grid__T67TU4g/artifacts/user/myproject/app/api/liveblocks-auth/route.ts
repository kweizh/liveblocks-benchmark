import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const session = liveblocks.prepareSession(`user-${Math.random()}`, {
    userInfo: {},
  });

  const { room } = await request.json();
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
