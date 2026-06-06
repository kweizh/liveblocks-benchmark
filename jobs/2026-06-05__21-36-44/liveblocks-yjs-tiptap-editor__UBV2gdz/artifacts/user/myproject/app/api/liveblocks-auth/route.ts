import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// A small palette of distinct colors for users
const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#7986CB",
  "#4FC3F7", "#4DB6AC", "#81C784", "#FFD54F",
  "#FF8A65", "#A1887F",
];

function getColorForUser(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function POST(request: NextRequest) {
  let username: string;
  try {
    const body = await request.json();
    username = body?.username || `anon-${Math.random().toString(36).slice(2, 7)}`;
  } catch {
    username = `anon-${Math.random().toString(36).slice(2, 7)}`;
  }

  const color = getColorForUser(username);

  const session = liveblocks.prepareSession(username, {
    userInfo: {
      name: username,
      color,
    },
  });

  // Grant access to all rooms
  session.allow("*", session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
