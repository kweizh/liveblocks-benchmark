import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Deterministic color palette keyed by userId
const COLORS = [
  "#E57373",
  "#81C784",
  "#64B5F6",
  "#FFD54F",
  "#BA68C8",
  "#4DB6AC",
  "#FF8A65",
  "#90A4AE",
];

function getColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name } = body as { userId: string; name: string };

  const role: "owner" | "voter" = userId === "alice" ? "owner" : "voter";
  const color = getColor(userId);

  const { status, body: responseBody } = await liveblocks.identifyUser(
    { userId, groupIds: ["poll-room"] },
    { userInfo: { name, color, role } }
  );

  return new NextResponse(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
