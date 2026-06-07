import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!secret) {
    return NextResponse.json({ error: "Missing LIVEBLOCKS_SECRET_KEY" }, { status: 500 });
  }

  const liveblocks = new Liveblocks({ secret });

  // Accept the user id from the request body, query param, or referer.
  let userId: string | undefined;

  // 1. Try request body (custom fields)
  let body: { userId?: string; user?: string; room?: string } = {};
  try {
    body = (await req.json().catch(() => ({}))) as { userId?: string; user?: string; room?: string };
    userId = body.userId || body.user;
  } catch {
    // ignore
  }

  // 2. Try query param on this request's URL
  if (!userId) {
    const url = new URL(req.url);
    userId = url.searchParams.get("user") || url.searchParams.get("userId") || undefined;
  }

  // 3. Try referer URL's query param (the page passes ?user=<id>)
  if (!userId) {
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const u = refUrl.searchParams.get("user") || refUrl.searchParams.get("userId");
        if (u) userId = u;
      } catch {
        // ignore
      }
    }
  }

  if (!userId) userId = "anonymous";

  const runId = process.env.ZEALT_RUN_ID || "local-dev";
  const roomId = `liveblocks-drawing-${runId}`;

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: userId },
  });
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new NextResponse(responseBody, { status });
}
