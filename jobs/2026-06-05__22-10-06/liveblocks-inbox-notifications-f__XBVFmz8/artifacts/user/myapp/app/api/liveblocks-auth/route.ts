import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(_request: NextRequest) {
  // For this task the authenticated user is always "user-1".
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: "user-1",
      groupIds: [],
    },
    {
      userInfo: {
        name: "User One",
        color: "#4F46E5",
      },
    }
  );

  return new Response(body, { status });
}
