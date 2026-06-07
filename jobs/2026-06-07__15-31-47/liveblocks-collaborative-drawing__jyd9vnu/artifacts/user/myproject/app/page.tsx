"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LiveList } from "@liveblocks/client";
import { RoomProvider } from "@/lib/liveblocks";
import { CanvasScaffold } from "@/components/CanvasScaffold";

function getRoomId(): string {
  const runId =
    typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_ZEALT_RUN_ID
      ? process.env.NEXT_PUBLIC_ZEALT_RUN_ID
      : "local-dev";
  return `liveblocks-drawing-${runId}`;
}

export default function Page() {
  // Read user id from ?user= query param. We wait until we've read it before
  // rendering the RoomProvider so the correct userId is used for auth.
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("user");
    setUserId(u && u.length > 0 ? u : "anonymous");
  }, []);

  const roomId = useMemo(() => getRoomId(), []);

  // Don't render the room until we know the userId, so the auth request
  // goes out with the correct identity.
  if (userId === null) {
    return null;
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ cursor: null }}
      initialStorage={{ strokes: new LiveList([]) }}
    >
      <CanvasScaffold userId={userId} />
    </RoomProvider>
  );
}
