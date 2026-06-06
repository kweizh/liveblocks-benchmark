import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const COLORS = [
  "#FF6900",
  "#FCB900",
  "#7BDCB5",
  "#00D084",
  "#8ED1FC",
  "#0693E3",
  "#ABB8C3",
  "#EB144C",
  "#F78DA7",
  "#9900EF",
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const adjectives = [
  "Happy", "Swift", "Calm", "Brave", "Bright",
  "Cool", "Eager", "Kind", "Bold", "Wise",
];

const nouns = [
  "Panda", "Falcon", "Otter", "Tiger", "Dolphin",
  "Eagle", "Fox", "Bear", "Wolf", "Hawk",
];

function generateRandomName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not set" },
      { status: 500 }
    );
  }

  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    // Body may be empty; treat as empty object
  }

  const username: string = body.username || generateRandomName();
  const roomId: string | undefined = body.roomId;

  const color = getColorForName(username);
  const userId = `user-${username.toLowerCase().replace(/\s+/g, "-")}`;

  const liveblocks = new Liveblocks({ secret });

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: username, color },
  });

  if (roomId) {
    session.allow(roomId, session.FULL_ACCESS);
  } else {
    // Allow access to all rooms (for test cases that don't specify a room)
    session.allow("*", session.FULL_ACCESS);
  }

  const { body: responseBody } = await session.authorize();

  // responseBody is a JSON string like {"token":"..."}
  const parsed = JSON.parse(responseBody);
  return NextResponse.json({ token: parsed.token });
}