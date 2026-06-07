"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
} from "@liveblocks/react/suspense";

function LikeButton() {
  const likes = useStorage((root) => root.likes) as number;

  const incrementLikes = useMutation(({ storage }) => {
    const currentLikes = storage.get("likes") as number;
    storage.set("likes", (currentLikes ?? 0) + 1);
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Liveblocks Like Button</h1>
      <div style={{ marginTop: "1rem" }}>
        <button 
          id="like-button" 
          onClick={incrementLikes}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", marginRight: "1rem" }}
        >
          Like
        </button>
        <span>
          Likes: <span id="like-count">{likes}</span>
        </span>
      </div>
    </main>
  );
}

export default function Home() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default";
  const roomId = `like-button-${runId}`;

  if (!publicApiKey) {
    return <div>Missing Liveblocks API key</div>;
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId} initialStorage={{ likes: 0 }}>
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          <LikeButton />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
