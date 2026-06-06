import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, userId, orgId } = body;

    if (!room || !userId || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: room, userId, or orgId" },
        { status: 400 }
      );
    }

    if (orgId !== "org-a" && orgId !== "org-b") {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 403 }
      );
    }

    if (!room.startsWith(`${orgId}:`)) {
      return NextResponse.json(
        { error: "Access denied: Room does not belong to your organization" },
        { status: 403 }
      );
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

    return new NextResponse(lbBody, { status });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
