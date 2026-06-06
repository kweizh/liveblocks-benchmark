import { Liveblocks } from "@liveblocks/node";
import { pickMockUserFromRequest } from "../../lib/mock-users";

const SECRET = process.env.LIVEBLOCKS_SECRET_KEY ?? "";

export async function POST(request: Request) {
  if (!SECRET) {
    return new Response(
      JSON.stringify({ error: "LIVEBLOCKS_SECRET_KEY is not set" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const liveblocks = new Liveblocks({ secret: SECRET });
  const user = pickMockUserFromRequest(request);

  const { status, body } = await liveblocks.identifyUser(
    {
      userId: user.userId,
      groupIds: [],
    },
    {
      userInfo: {
        name: user.name,
        avatar: user.avatar,
        color: user.color,
      },
    }
  );

  return new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}
