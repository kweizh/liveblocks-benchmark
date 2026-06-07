import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: NextRequest) {
  const roomId = `color-picker-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).substring(2, 9)}`,
    {}
  );

  session.allow(roomId, session.FULL_ACCESS);

  const { body, status } = await session.authorize();

  return new NextResponse(body, { status });
}