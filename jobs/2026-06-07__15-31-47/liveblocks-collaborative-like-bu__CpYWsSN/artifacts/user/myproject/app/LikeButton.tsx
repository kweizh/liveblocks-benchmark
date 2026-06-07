"use client";

import { useStorage, useMutation } from "../liveblocks.config";

export function LikeButton() {
  const likes = useStorage((root) => root.likes);

  const increment = useMutation(({ storage }) => {
    storage.set("likes", (storage.get("likes") ?? 0) + 1);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
      <button
        id="like-button"
        onClick={increment}
        style={{
          fontSize: "2rem",
          padding: "0.5rem 2rem",
          cursor: "pointer",
          borderRadius: "8px",
          border: "2px solid #e2e8f0",
          background: "#fff",
        }}
      >
        👍 Like
      </button>
      <span id="like-count" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        {likes}
      </span>
    </div>
  );
}
