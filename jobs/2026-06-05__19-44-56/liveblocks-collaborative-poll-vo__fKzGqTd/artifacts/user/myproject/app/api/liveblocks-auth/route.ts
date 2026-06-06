import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(req: NextRequest) {
  try {
    const { userId, name } = await req.json();

    const role = userId === "alice" ? "owner" : "voter";

    // Generate a deterministic color based on userId length
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
    const color = colors[(userId?.length || 0) % colors.length];

    const { status, body } = await liveblocks.identifyUser(
      { userId, groupIds: ["poll-room"] },
      { userInfo: { name: name || "Anonymous", color, role } }
    );

    return new NextResponse(body, { status });
  } catch (err) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
