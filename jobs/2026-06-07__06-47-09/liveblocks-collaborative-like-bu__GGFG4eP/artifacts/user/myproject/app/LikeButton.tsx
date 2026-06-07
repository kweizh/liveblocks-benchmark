"use client";

import { useStorage, useMutation } from "@liveblocks/react/suspense";

export function LikeButton() {
  const likes = useStorage((root: any) => root.likes);
  
  const increment = useMutation(({ storage }) => {
    const currentLikes = (storage.get("likes") as number) ?? 0;
    storage.set("likes", currentLikes + 1);
  }, []);

  return (
    <div>
      <button id="like-button" onClick={() => increment()}>
        Like
      </button>
      <span id="like-count">{likes}</span>
    </div>
  );
}
