import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: Request) {
  const runId = process.env.ZEALT_RUN_ID || process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
  const userId = `user-${Math.random().toString(36).slice(2, 10)}`;

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: userId },
  });

  // Allow full access to any room scoped by the current run id.
  session.allow(`harbor-timer-${runId}`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
