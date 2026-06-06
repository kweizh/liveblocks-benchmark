import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Deterministic color assignment based on userId
function getColor(userId: string): string {
  const colors = [
    "#E57373",
    "#81C784",
    "#64B5F6",
    "#FFD54F",
    "#CE93D8",
    "#4DB6AC",
    "#FF8A65",
    "#A1887F",
    "#90A4AE",
    "#F06292",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "Missing userId or name" },
        { status: 400 }
      );
    }

    const role = userId === "alice" ? "owner" : "voter";
    const color = getColor(userId);

    const result = await liveblocks.identifyUser(
      { userId, groupIds: ["poll-room"] },
      { userInfo: { name, color, role } }
    );

    return new Response(result.body, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}