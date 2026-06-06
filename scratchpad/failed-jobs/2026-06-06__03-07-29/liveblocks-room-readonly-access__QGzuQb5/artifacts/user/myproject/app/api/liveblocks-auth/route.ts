import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  let body: { room?: string; userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { room, userId, role } = body;

  if (!room || !userId || !role) {
    return NextResponse.json(
      { error: "Missing required fields: room, userId, or role" },
      { status: 400 }
    );
  }

  if (role !== "editor" && role !== "viewer") {
    return NextResponse.json(
      { error: 'Invalid role. Must be "editor" or "viewer"' },
      { status: 400 }
    );
  }

  const session = liveblocks.prepareSession(userId, {
    userInfo: { role },
  });

  session.allow(
    room,
    role === "viewer" ? session.READ_ACCESS : session.FULL_ACCESS
  );

  const { status, body: responseBody } = await session.authorize();

  return new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}