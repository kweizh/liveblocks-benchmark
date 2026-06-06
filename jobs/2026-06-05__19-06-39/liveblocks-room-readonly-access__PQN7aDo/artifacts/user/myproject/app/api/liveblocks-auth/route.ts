import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { room, userId, role } = body;

    if (!room || typeof room !== "string") {
      return NextResponse.json({ error: "Missing or invalid room" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }
    if (!role || (role !== "editor" && role !== "viewer")) {
      return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
    }

    const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "LIVEBLOCKS_SECRET_KEY is not configured" }, { status: 500 });
    }

    const liveblocks = new Liveblocks({ secret: secretKey });

    const session = liveblocks.prepareSession(userId, {
      userInfo: { role },
    });

    session.allow(room, role === "viewer" ? session.READ_ACCESS : session.FULL_ACCESS);

    const { status, body: authBody } = await session.authorize();

    return new Response(authBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
