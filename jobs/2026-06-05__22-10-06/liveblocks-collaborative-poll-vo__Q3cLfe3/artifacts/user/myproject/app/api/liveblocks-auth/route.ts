import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  const { userId, name } = await req.json();

  const role = userId === "alice" ? "owner" : "voter";
  
  // Deterministic color based on name
  const colors = ["#D583F0", "#F08385", "#85F083", "#83E7F0", "#838CF0"];
  const colorIndex = Math.abs(name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIndex];

  const session = await liveblocks.identifyUser(
    {
      userId,
      groupIds: ["poll-room"],
    },
    {
      userInfo: {
        name,
        color,
        role,
      },
    }
  );

  return new NextResponse(session.body, { status: session.status });
}
