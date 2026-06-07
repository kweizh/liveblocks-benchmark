"use client";

import { LiveblocksProvider, RoomProvider, useThreads, useEditThreadMetadata } from "@liveblocks/react";
import { Thread } from "@liveblocks/react-ui";

const roomId = `comments-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export default function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId}>
        <Room />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function Room() {
  const { threads, error, isLoading } = useThreads();
  const editThreadMetadata = useEditThreadMetadata();

  if (isLoading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading threads...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>
        Error loading threads: {error.message}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Liveblocks Comments Sidebar</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {threads && threads.length > 0 ? (
          threads.map((thread) => {
            const isResolved = thread.metadata.resolved === true;

            return (
              <div
                key={thread.id}
                data-testid="thread-card"
                data-thread-id={thread.id}
                data-resolved={isResolved ? "true" : "false"}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  transition: "opacity 0.2s ease",
                  opacity: isResolved ? 0.5 : 1,
                  backgroundColor: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Thread thread={thread} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    data-testid="resolve-button"
                    data-thread-id={thread.id}
                    disabled={isResolved}
                    onClick={() => {
                      editThreadMetadata({
                        threadId: thread.id,
                        metadata: { resolved: true },
                      });
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: isResolved ? "#ccc" : "#0070f3",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isResolved ? "default" : "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {isResolved ? "Resolved" : "Resolve"}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: "#666" }}>No comment threads in this room yet.</div>
        )}
      </div>
    </div>
  );
}
