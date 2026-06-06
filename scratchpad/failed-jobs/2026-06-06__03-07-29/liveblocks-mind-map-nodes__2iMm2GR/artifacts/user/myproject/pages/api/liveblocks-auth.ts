import type { NextApiRequest, NextApiResponse } from "next";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { room } = req.body;

  const session = liveblocks.prepareSession(
    `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    {
      userInfo: {
        name: "Anonymous",
      },
    }
  );

  session.allow(room, session.FULL_ACCESS);
  const { body, status } = await session.authorize();

  return res.status(status).json(body);
}