import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEBLOCKS_SECRET_KEY!;

const liveblocks = new Liveblocks({
  secret: API_KEY,
});

const COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF3",
  "#FF33A8", "#A833FF", "#33FFA8", "#FF8C33", "#33FF8C"
];

function getRandomColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = body.username || "Anonymous";

  // Create a session for the current user
  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).slice(2, 9)}`,
    {
      userInfo: {
        name: username,
        color: getRandomColor(username),
      },
    }
  );

  // Grant the user access to every room
  session.allow("*", session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body: responseBody } = await session.authorize();
  return new NextResponse(responseBody, { status });
}
