import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const roomId = `comments-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  // Prepare session with a unique/static user ID
  const session = liveblocks.prepareSession("user-1");

  // Grant full access to the specific room
  session.allow(roomId, session.FULL_ACCESS);

  // Authorize and get the access token
  const { status, body } = await session.authorize();

  return new Response(body, { status });
}
