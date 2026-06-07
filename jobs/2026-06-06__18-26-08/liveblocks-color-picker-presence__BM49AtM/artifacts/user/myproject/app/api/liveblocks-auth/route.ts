import { Liveblocks } from "@liveblocks/node";

const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;

if (!secretKey) {
  console.warn("Warning: LIVEBLOCKS_SECRET_KEY is not defined.");
}

const liveblocks = new Liveblocks({
  secret: secretKey || "sk_placeholder",
});

export async function POST(request: Request) {
  try {
    const { room } = await request.json();

    // Generate a random user ID for the session
    const userId = `user-${Math.floor(Math.random() * 100000)}`;
    const session = liveblocks.prepareSession(userId);

    // Grant full access to the requested room
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // Authorize the session
    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Authentication error in /api/liveblocks-auth:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
