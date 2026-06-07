import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { room } = await request.json();

    const session = liveblocks.prepareSession(
      `user-${Math.floor(Math.random() * 10000)}`,
      { userInfo: {} }
    );

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
