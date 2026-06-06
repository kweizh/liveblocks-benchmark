import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";

const anonymousNames = ["Panda", "Fox", "Koala", "Owl", "Sloth", "Otter", "Badger", "Hedgehog"];
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3", "#33FFF0", "#FFA500", "#800080"];

export async function POST(_request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Missing LIVEBLOCKS_SECRET_KEY" }, { status: 500 });
  }

  const liveblocks = new Liveblocks({ secret });

  let username = "";
  try {
    const body = await _request.json();
    if (body && typeof body.username === "string" && body.username.trim() !== "") {
      username = body.username.trim();
    }
  } catch (e) {
    // Ignore error if body is empty or not valid JSON
  }

  if (!username) {
    const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
    username = `Anonymous ${randomName}`;
  }

  // Pick a deterministic color per user
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  // Generate a unique userId or use the username
  const userId = `user-${username.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${Math.floor(Math.random() * 100000)}`;

  try {
    const { status, body } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [],
      },
      {
        userInfo: {
          name: username,
          color,
        },
      }
    );

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Liveblocks auth error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
