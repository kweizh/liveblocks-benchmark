"use client";

import { useStorage, useMutation } from "../liveblocks.config";

export default function LikeButton() {
  const likes = useStorage((root) => root.likes);

  const increment = useMutation(({ storage }) => {
    storage.set("likes", (storage.get("likes") ?? 0) + 1);
  }, []);

  return (
    <div>
      <button id="like-button" onClick={increment}>
        👍 Like
      </button>
      <span id="like-count">{likes}</span>
    </div>
  );
}
