import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

export async function POST(request: Request) {
  try {
    const liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
    });

    const body = await request.json();
    const { room, userId, orgId } = body;

    if (!room || !userId || !orgId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (orgId !== "org-a" && orgId !== "org-b") {
      return NextResponse.json({ error: "Invalid orgId" }, { status: 403 });
    }

    if (!room.startsWith(`${orgId}:`)) {
      return NextResponse.json({ error: "Room prefix mismatch" }, { status: 403 });
    }

    const { status, body: lbBody } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [orgId],
      },
      {
        userInfo: { orgId },
      }
    );

    return new NextResponse(lbBody, { 
      status, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
