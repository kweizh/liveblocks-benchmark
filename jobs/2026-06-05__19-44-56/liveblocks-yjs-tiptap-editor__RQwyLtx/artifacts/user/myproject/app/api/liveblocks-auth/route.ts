import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

const COLORS = [
  "#E57373", "#9575CD", "#4FC3F7", "#81C784", "#FFF176", "#FF8A65",
];

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }
  
  const username = body.username || `Anonymous ${Math.floor(Math.random() * 1000)}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  // Create a session for the user
  const session = liveblocks.prepareSession(
    `user-${Math.floor(Math.random() * 10000)}`,
    {
      userInfo: {
        name: username,
        color: color,
      },
    }
  );

  // Give the user access to all rooms
  session.allow("*", session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body: sessionBody } = await session.authorize();

  return new Response(sessionBody, { status });
}
