import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const ALLOWED_ORGS = new Set(["org-a", "org-b"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { room, userId, orgId } = body as Record<string, unknown>;

  // Validate required fields
  if (typeof room !== "string" || room.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid required field: room" },
      { status: 400 },
    );
  }
  if (typeof userId !== "string" || userId.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid required field: userId" },
      { status: 400 },
    );
  }
  if (typeof orgId !== "string" || orgId.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid required field: orgId" },
      { status: 400 },
    );
  }

  // Validate orgId is in the allowed set
  if (!ALLOWED_ORGS.has(orgId)) {
    return NextResponse.json(
      { error: `Organization '${orgId}' is not allowed` },
      { status: 403 },
    );
  }

  // Validate room prefix matches orgId
  if (!room.startsWith(`${orgId}:`)) {
    return NextResponse.json(
      { error: `Room '${room}' does not belong to organization '${orgId}'` },
      { status: 403 },
    );
  }

  // Mint an ID token via Liveblocks
  const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
  });

  const result = await liveblocks.identifyUser(
    { userId, groupIds: [orgId] },
    { userInfo: { orgId } },
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.status },
    );
  }

  // Return the upstream response body and status verbatim
  return new Response(result.body, {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}