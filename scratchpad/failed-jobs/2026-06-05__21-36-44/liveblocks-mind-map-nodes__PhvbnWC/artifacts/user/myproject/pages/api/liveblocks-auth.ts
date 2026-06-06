import { Liveblocks } from "@liveblocks/node";
import type { NextApiRequest, NextApiResponse } from "next";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = liveblocks.prepareSession(`user-${Math.random().toString(36).slice(2)}`, {
      userInfo: {
        name: "Anonymous",
      },
    });

    // Allow access to the mind-map room
    session.allow(`mind-map-*`, session.FULL_ACCESS);

    const { body, status } = await session.authorize();
    return res.status(status).send(body);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
