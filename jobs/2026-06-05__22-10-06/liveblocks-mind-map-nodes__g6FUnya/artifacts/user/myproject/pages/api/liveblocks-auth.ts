import { Liveblocks } from "@liveblocks/node";
import { NextApiRequest, NextApiResponse } from "next";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const session = liveblocks.prepareSession(
    `user-${Math.floor(Math.random() * 1000)}`,
    { userInfo: {} }
  );

  const { room } = req.body;
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  res.status(status).send(body);
}
