import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const ALLOWED_ORGS = new Set(["org-a", "org-b"]);

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

  const { room, userId, orgId } = (body ?? {}) as Record<string, unknown>;

  // Validate required fields
  if (!room || typeof room !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid required field: room" },
      { status: 400 },
    );
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid required field: userId" },
      { status: 400 },
    );
  }
  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid required field: orgId" },
      { status: 400 },
    );
  }

  // Validate orgId is in the allowed set
  if (!ALLOWED_ORGS.has(orgId)) {
    return NextResponse.json(
      { error: `Organization "${orgId}" is not allowed` },
      { status: 403 },
    );
  }

  // Validate room belongs to the org
  if (!room.startsWith(`${orgId}:`)) {
    return NextResponse.json(
      {
        error: `Room "${room}" does not belong to organization "${orgId}"`,
      },
      { status: 403 },
    );
  }

  // Mint an ID token
  const { status, body: responseBody } = await liveblocks.identifyUser(
    { userId, groupIds: [orgId] },
    { userInfo: { orgId } },
  );

  return new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
