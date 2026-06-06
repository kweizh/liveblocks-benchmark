import { Liveblocks } from "@liveblocks/node";

const SECRET = process.env.LIVEBLOCKS_SECRET_KEY ?? "";

export async function POST(request: Request) {
  if (!SECRET) {
    return new Response(
      JSON.stringify({ error: "LIVEBLOCKS_SECRET_KEY is not set" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  const liveblocks = new Liveblocks({ secret: SECRET });
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const userId = `user-${Math.floor(Math.random() * 1_000_000)}`;
  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: userId, color: "#888" },
  });
  const roomId =
    typeof body?.room === "string" && body.room.length > 0 ? body.room : "*";
  session.allow(roomId, session.FULL_ACCESS);
  const { status, body: respBody } = await session.authorize();
  return new Response(respBody, {
    status,
    headers: { "content-type": "application/json" },
  });
}
