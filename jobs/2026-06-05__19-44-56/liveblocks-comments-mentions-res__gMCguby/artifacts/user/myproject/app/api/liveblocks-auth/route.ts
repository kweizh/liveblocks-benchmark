import { Liveblocks } from "@liveblocks/node";
import { USERS } from "../../users";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

// The currently authenticated user is always `user-alice` in this scaffold.
// This is what makes `identifyUser` correct end-to-end and lets mentions
// resolve a "real" current user identity.
export async function POST(_request: Request) {
  const currentUser = USERS[0]; // user-alice
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: currentUser.id,
      groupIds: [],
    },
    {
      userInfo: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    },
  );
  return new Response(body, { status });
}
