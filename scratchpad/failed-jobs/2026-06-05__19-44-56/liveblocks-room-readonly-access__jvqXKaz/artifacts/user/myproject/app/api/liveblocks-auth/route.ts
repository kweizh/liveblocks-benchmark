import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room, userId, role } = body;

    if (!room || !userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields: room, userId, or role" },
        { status: 400 }
      );
    }

    if (role !== "editor" && role !== "viewer") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'editor' or 'viewer'" },
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

    const { status, body: authBody } = await session.authorize();
    
    return new Response(authBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
