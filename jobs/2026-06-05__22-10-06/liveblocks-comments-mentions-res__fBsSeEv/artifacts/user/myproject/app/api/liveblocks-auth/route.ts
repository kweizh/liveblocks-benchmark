import { Liveblocks } from "@liveblocks/node";
import { USERS } from "../../users";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

export async function POST(request: Request) {
  const { room } = await request.json();
  const currentUser = USERS[0]; // user-alice
  const session = liveblocks.prepareSession(currentUser.id, {
    userInfo: {
      name: currentUser.name,
      avatar: currentUser.avatar,
    },
  });
  session.allow(room, session.FULL_ACCESS);
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
