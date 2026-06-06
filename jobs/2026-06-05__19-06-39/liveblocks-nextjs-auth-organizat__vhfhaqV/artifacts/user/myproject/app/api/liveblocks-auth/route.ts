import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { room, userId, orgId } = body;

    // Validate presence of required fields
    if (!room || !userId || !orgId) {
      return NextResponse.json({ error: "Missing required fields: room, userId, or orgId" }, { status: 400 });
    }

    if (typeof room !== "string" || typeof userId !== "string" || typeof orgId !== "string") {
      return NextResponse.json({ error: "Fields room, userId, and orgId must be strings" }, { status: 400 });
    }

    // Gate access by organization: orgId must be org-a or org-b
    if (orgId !== "org-a" && orgId !== "org-b") {
      return NextResponse.json({ error: "Forbidden: Invalid organization" }, { status: 403 });
    }

    // Gate room access: room ID must start with `${orgId}:`
    if (!room.startsWith(`${orgId}:`)) {
      return NextResponse.json({ error: `Forbidden: Access denied to room ${room} for organization ${orgId}` }, { status: 403 });
    }

    // Mint ID token via liveblocks.identifyUser
    const result = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [orgId],
      },
      {
        userInfo: {
          orgId,
        },
      }
    );

    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
