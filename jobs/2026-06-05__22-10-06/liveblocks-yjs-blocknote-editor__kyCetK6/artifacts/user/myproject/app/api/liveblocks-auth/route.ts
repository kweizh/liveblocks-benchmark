import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  // For a real application, you would authenticate the user here
  const user = {
    id: "user-" + Math.floor(Math.random() * 1000),
    info: {
      name: "User " + Math.floor(Math.random() * 100),
      color: getRandomColor(),
    },
  };

  const { room } = await request.json();

  const session = liveblocks.prepareSession(user.id, {
    userInfo: user.info,
  });

  session.allow(room, session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new NextResponse(body, { status });
}

function getRandomColor() {
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
  return colors[Math.floor(Math.random() * colors.length)];
}
