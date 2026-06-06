import { Liveblocks } from "@liveblocks/node";
import type { NextApiRequest, NextApiResponse } from "next";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = liveblocks.prepareSession("user-" + Math.floor(Math.random() * 10000));
  session.allow(`mind-map-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`, session.FULL_ACCESS);
  
  const { status, body } = await session.authorize();
  res.status(status).send(body);
}