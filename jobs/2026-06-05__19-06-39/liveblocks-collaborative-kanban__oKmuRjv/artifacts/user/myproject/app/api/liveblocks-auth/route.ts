import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

export async function POST(request: Request) {
  let room: string | undefined;
  try {
    const body = await request.json();
    room = body.room;
  } catch (e) {
    // ignore if body parsing fails
  }

  const session = liveblocks.prepareSession(
    "user-" + Math.random().toString(36).substring(2, 9),
    {
      userInfo: {
        name: "Anonymous",
        avatar: "",
      },
    }
  );

  if (room && room.startsWith("kanban-")) {
    session.allow(room, session.FULL_ACCESS);
  } else {
    session.allow("kanban-*", session.FULL_ACCESS);
  }

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
