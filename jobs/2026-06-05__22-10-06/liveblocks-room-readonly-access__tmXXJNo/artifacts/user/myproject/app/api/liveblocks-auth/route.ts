import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
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
        { error: "Invalid role. Role must be 'editor' or 'viewer'" },
        { status: 400 }
      );
    }

    // Start a Liveblocks session
    const session = liveblocks.prepareSession(userId, {
      userInfo: { role },
    });

    // Grant permissions based on the role
    if (role === "editor") {
      session.allow(room, session.FULL_ACCESS);
    } else {
      session.allow(room, session.READ_ACCESS);
    }

    // Authorize the session and return the response
    const { status, body: responseBody } = await session.authorize();
    return new Response(responseBody, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 400 } // Requirement says reject malformed or invalid with 400
    );
  }
}
