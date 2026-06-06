import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_mock_key_for_build",
});

const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3", "#33FFF3"];
const getDeterministicColor = (id: string) => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return COLORS[sum % COLORS.length];
};

export async function POST(req: NextRequest) {
  try {
    const { userId, name } = await req.json();

    if (!userId || !name) {
      return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
    }

    const role = userId === "alice" ? "owner" : "voter";
    const color = getDeterministicColor(userId);

    const { status, body } = await liveblocks.identifyUser(
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

    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Error in liveblocks-auth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
