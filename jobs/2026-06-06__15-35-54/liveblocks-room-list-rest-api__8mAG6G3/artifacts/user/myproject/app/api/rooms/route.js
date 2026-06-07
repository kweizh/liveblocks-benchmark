import { NextResponse } from "next/server";

export async function GET() {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.liveblocks.io/v2/rooms", {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Liveblocks API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Forward the response data. Shape: { nextCursor, data: [...] }
    return NextResponse.json({ data: data.data || [] });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || process.env.ZEALT_RUN_ID || "";
  const timestamp = Date.now();
  const roomId = `harbor-created-${runId}-${timestamp}`;

  try {
    const response = await fetch("https://api.liveblocks.io/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: roomId,
        defaultAccesses: ["room:write"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Liveblocks API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const createdRoom = await response.json();
    return NextResponse.json({ id: createdRoom.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
