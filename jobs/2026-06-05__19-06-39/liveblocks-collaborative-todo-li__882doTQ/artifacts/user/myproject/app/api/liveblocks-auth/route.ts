import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured." },
      { status: 500 }
    );
  }
  const liveblocks = new Liveblocks({ secret });

  const userId = `user-${Math.floor(Math.random() * 1_000_000)}`;
  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: userId },
  });
  session.allow(`harbor-todo-*`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
