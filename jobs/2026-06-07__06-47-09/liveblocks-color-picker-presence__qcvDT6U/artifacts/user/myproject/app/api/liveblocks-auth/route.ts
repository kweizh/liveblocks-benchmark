import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: NextRequest) {
  // Create a session for the current user
  // In a real application, you would get the user's info from your database or session
  const session = liveblocks.prepareSession(
    `user-${Math.floor(Math.random() * 10000)}`,
    { userInfo: {} }
  );

  // Give the user access to all rooms for this example
  session.allow("*", session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
