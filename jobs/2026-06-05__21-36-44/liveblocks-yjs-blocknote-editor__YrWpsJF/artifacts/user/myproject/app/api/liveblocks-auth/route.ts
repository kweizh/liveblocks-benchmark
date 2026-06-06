import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// A small palette of user colors for cursor display
const USER_COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#7986CB",
  "#64B5F6", "#4DB6AC", "#81C784", "#FFD54F",
  "#FF8A65", "#A1887F",
];

// Simple adjective + noun combos for random guest names
const ADJECTIVES = ["Swift", "Bright", "Cool", "Bold", "Calm", "Keen", "Wise", "Fair"];
const NOUNS = ["Otter", "Eagle", "Tiger", "Panda", "Raven", "Lynx", "Finch", "Crane"];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: NextRequest) {
  // Prepare a random guest identity for this session
  const name = `${randomElement(ADJECTIVES)} ${randomElement(NOUNS)}`;
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

  const { status, body } = await liveblocks.identifyUser(
    {
      userId: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      groupIds: [],
    },
    {
      userInfo: {
        name,
        color,
      },
    }
  );

  return new NextResponse(body, { status });
}
