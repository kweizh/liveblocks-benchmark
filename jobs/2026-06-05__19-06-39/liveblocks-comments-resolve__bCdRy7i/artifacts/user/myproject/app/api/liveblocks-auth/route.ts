import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

export async function POST(_request: Request) {
  const userId = `user-${Math.random().toString(36).slice(2, 10)}`;
  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: [],
    },
    {
      userInfo: {
        name: "Anonymous User",
        color: "#0ea5e9",
      },
    },
  );
  return new Response(body, { status });
}
