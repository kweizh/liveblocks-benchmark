import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
  });

  const user = { id: "user_" + Math.random().toString(36).substring(2, 9), info: {} };

  const { status, body } = await liveblocks.identifyUser(
    {
      userId: user.id,
      groupIds: [],
    },
    { userInfo: user.info }
  );

  return new Response(body, { status });
}
