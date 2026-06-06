import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const { room, userId, role } = body as Record<string, unknown>;

  if (!room || typeof room !== "string") {
    return NextResponse.json({ error: "Missing or invalid field: room" }, { status: 400 });
  }

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing or invalid field: userId" }, { status: 400 });
  }

  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "Missing or invalid field: role" }, { status: 400 });
  }

  if (role !== "editor" && role !== "viewer") {
    return NextResponse.json(
      { error: 'Invalid role: must be "editor" or "viewer"' },
      { status: 400 }
    );
  }

  const session = liveblocks.prepareSession(userId, {
    userInfo: { role },
  });

  if (role === "viewer") {
    session.allow(room, session.READ_ACCESS);
  } else {
    session.allow(room, session.FULL_ACCESS);
  }

  const { status, body: responseBody } = await session.authorize();

  return new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
