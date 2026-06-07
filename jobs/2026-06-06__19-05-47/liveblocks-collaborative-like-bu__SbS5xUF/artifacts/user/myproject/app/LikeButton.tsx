"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useMutation,
  useStorage,
} from "@liveblocks/react";

const roomId = `like-button-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

function LikeButtonInner() {
  const likes = useStorage((root) => root.likes);

  const increment = useMutation(({ storage }) => {
    const currentLikes = (storage.get("likes") as number) ?? 0;
    storage.set("likes", currentLikes + 1);
  }, []);

  return (
    <div>
      <button id="like-button" onClick={increment}>
        Like
      </button>
      <span id="like-count">{likes as number}</span>
    </div>
  );
}

export default function LikeButton() {
  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      <RoomProvider id={roomId} initialStorage={{ likes: 0 }}>
        <ClientSideSuspense fallback={<span id="like-count">0</span>}>
          <LikeButtonInner />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}