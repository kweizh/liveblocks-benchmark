"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LiveblocksProvider,
  RoomProvider,
  useSelf,
  useStorage,
  useMutation,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import {
  LiveObject,
  LiveList,
  LiveMap,
} from "@liveblocks/client";

const ROOM_ID = `poll-room-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local"}`;

// Type for user info stored in Liveblocks
type UserInfo = {
  name: string;
  color: string;
  role: "owner" | "voter";
};

// Type for option data
type OptionData = {
  id: string;
  label: string;
};

function PollInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = useSelf((me: any) => (me.info as UserInfo).role) as "owner" | "voter";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = useSelf((me: any) => me.id) as string;

  const question = useStorage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (storage: any) => storage.poll.question as string
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options = useStorage((storage: any) => storage.poll.options) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votes = useStorage((storage: any) => storage.votes) as any;

  const [newOptionLabel, setNewOptionLabel] = useState("");

  // Compute tallies
  const { totalVotes, optionCounts, myVote } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    let currentVote: string | null = null;

    if (votes && typeof votes === "object") {
      // votes is a LiveMap<string, string>
      let entriesArr: [string, string][];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (votes as any).entries === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entriesArr = Array.from((votes as any).entries() as Iterable<[string, string]>);
      } else {
        entriesArr = Object.entries(votes as Record<string, string>);
      }
      for (const [userId, optionId] of entriesArr) {
        counts[optionId] = (counts[optionId] || 0) + 1;
        total++;
        if (userId === myId) {
          currentVote = optionId;
        }
      }
    }

    return { totalVotes: total, optionCounts: counts, myVote: currentVote };
  }, [votes, myId]);

  // Set question (owner only)
  const setQuestion = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, value: string) => {
      storage.get("poll").set("question", value);
    },
    []
  );

  // Add option (owner only)
  const addOption = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, label: string) => {
      const id = crypto.randomUUID();
      storage.get("poll").get("options").push(new LiveObject({ id, label }));
    },
    []
  );

  // Remove option (owner only)
  const removeOption = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, optionId: string) => {
      const opts = storage.get("poll").get("options");
      const len = opts.length;
      for (let i = 0; i < len; i++) {
        if (opts.get(i).get("id") === optionId) {
          opts.delete(i);
          break;
        }
      }
    },
    []
  );

  // Vote
  const vote = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ storage }: any, optionId: string) => {
      storage.get("votes").set(myId, optionId);
    },
    [myId]
  );

  const handleAddOption = useCallback(() => {
    const trimmed = newOptionLabel.trim();
    if (trimmed) {
      addOption(trimmed);
      setNewOptionLabel("");
    }
  }, [newOptionLabel, addOption]);

  const isOwner = role === "owner";

  // Convert options LiveList to array for rendering
  const optionsArray: OptionData[] = useMemo(() => {
    if (!options) return [];
    if (typeof options.toArray === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return options.toArray().map((o: any) => ({
        id: o.get("id") ?? o.id,
        label: o.get("label") ?? o.label,
      }));
    }
    if (Array.isArray(options)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return options.map((o: any) => ({
        id: o.id ?? o.get?.("id"),
        label: o.label ?? o.get?.("label"),
      }));
    }
    return [];
  }, [options]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 600 }}>
      <h1>Liveblocks Collaborative Poll</h1>

      {/* Question input */}
      {isOwner ? (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
            Question:
          </label>
          <input
            data-testid="question-input"
            value={question ?? ""}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter poll question..."
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
            Question:
          </label>
          <input
            data-testid="question-input"
            value={question ?? ""}
            readOnly
            disabled
            style={{ width: "100%", padding: 8, fontSize: 16, opacity: 0.6 }}
          />
        </div>
      )}

      {/* Add option form (owner only) */}
      {isOwner && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <input
            data-testid="new-option-input"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="New option..."
            style={{ flex: 1, padding: 8, fontSize: 14 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddOption();
            }}
          />
          <button
            data-testid="add-option-btn"
            onClick={handleAddOption}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            Add option
          </button>
        </div>
      )}

      {/* Options list */}
      <div style={{ marginBottom: 16 }}>
        {optionsArray.map((option) => {
          const id = option.id;
          const label = option.label;
          const count = optionCounts[id] || 0;
          const percentage =
            totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

          return (
            <div
              key={id}
              style={{
                marginBottom: 12,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span data-testid={`label-${id}`} style={{ fontWeight: "bold" }}>
                  {label}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    data-testid={`vote-${id}`}
                    onClick={() => vote(id)}
                    style={{
                      padding: "4px 12px",
                      fontSize: 13,
                      background: myVote === id ? "#4CAF50" : "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {myVote === id ? "✓ Voted" : "Vote"}
                  </button>
                  {isOwner && (
                    <button
                      data-testid={`remove-${id}`}
                      onClick={() => removeOption(id)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 13,
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div
                style={{
                  background: "#e0e0e0",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: 24,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    background: "#4CAF50",
                    height: "100%",
                    transition: "width 0.3s ease",
                  }}
                />
                <span
                  data-testid={`bar-${id}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 8,
                    lineHeight: "24px",
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total votes */}
      <div data-testid="total-votes" style={{ fontWeight: "bold" }}>
        Total votes: {totalVotes}
      </div>
    </div>
  );
}

function PollPageInner() {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialStorage={() => ({
        poll: new LiveObject({
          question: "",
          options: new LiveList<LiveObject<{ id: string; label: string }>>([]),
        }),
        votes: new LiveMap(),
      })}
    >
      <ClientSideSuspense
        fallback={
          <div style={{ padding: 24, fontFamily: "system-ui" }}>
            Loading poll...
          </div>
        }
      >
        {() => <PollInner />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

function PollPageWithParams() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const name = searchParams.get("name") || "";

  const authFn = useCallback(
    async () => {
      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });
      return response.json();
    },
    [userId, name]
  );

  return (
    <LiveblocksProvider authEndpoint={authFn}>
      <PollPageInner />
    </LiveblocksProvider>
  );
}

export default function PollPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
          Loading...
        </div>
      }
    >
      <PollPageWithParams />
    </React.Suspense>
  );
}