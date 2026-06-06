"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import {
  RoomProviderSuspense,
  useSelfSuspense,
  useStorageSuspense,
  useMutationSuspense,
  userRef,
} from "../liveblocks.config";

const ROOM_ID = `poll-room-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

// ─── Poll inner component (inside suspense boundary — storage is never null) ─
function PollInner() {
  const self = useSelfSuspense();
  const role = self.info.role;

  const [newOptionLabel, setNewOptionLabel] = useState("");

  // ── Storage selectors (suspense variants never return null) ───────────────
  const question = useStorageSuspense((root) => root.poll.question);

  const options = useStorageSuspense((root) =>
    root.poll.options.map((opt) => ({ id: opt.id, label: opt.label }))
  );

  const votes = useStorageSuspense((root) => {
    const map: Record<string, string> = {};
    root.votes.forEach((optionId, userId) => {
      map[userId] = optionId;
    });
    return map;
  });

  // ── Derived tallies ────────────────────────────────────────────────────────
  const totalVotes = Object.keys(votes).length;

  function getPercentage(optionId: string): number {
    if (totalVotes === 0) return 0;
    const count = Object.values(votes).filter((v) => v === optionId).length;
    return Math.round((count / totalVotes) * 100);
  }

  const myVote = votes[self.id];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateQuestion = useMutationSuspense(
    ({ storage }, value: string) => {
      storage.get("poll").set("question", value);
    },
    []
  );

  const addOption = useMutationSuspense(
    ({ storage }, label: string) => {
      const id = crypto.randomUUID();
      const option = new LiveObject({ id, label });
      storage.get("poll").get("options").push(option);
    },
    []
  );

  const removeOption = useMutationSuspense(
    ({ storage }, optionId: string) => {
      const opts = storage.get("poll").get("options");
      const idx = opts.findIndex((o) => o.get("id") === optionId);
      if (idx !== -1) {
        opts.delete(idx);
      }
      const votesMap = storage.get("votes");
      const toDelete: string[] = [];
      votesMap.forEach((votedOptionId, uid) => {
        if (votedOptionId === optionId) toDelete.push(uid);
      });
      toDelete.forEach((uid) => votesMap.delete(uid));
    },
    []
  );

  const castVote = useMutationSuspense(
    ({ storage, self }, optionId: string) => {
      storage.get("votes").set(self.id, optionId);
    },
    []
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddOption = useCallback(() => {
    const trimmed = newOptionLabel.trim();
    if (!trimmed) return;
    addOption(trimmed);
    setNewOptionLabel("");
  }, [newOptionLabel, addOption]);

  const isOwner = role === "owner";

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 600 }}>
      <h1>Liveblocks Collaborative Poll</h1>

      {/* Question */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block" }}>
          <strong>Question:</strong>
          <input
            data-testid="question-input"
            value={question}
            onChange={(e) => isOwner && updateQuestion(e.target.value)}
            readOnly={!isOwner}
            disabled={!isOwner}
            style={{ display: "block", width: "100%", fontSize: 16, padding: 4, marginTop: 4 }}
            placeholder="Enter poll question…"
          />
        </label>
      </div>

      {/* Owner-only: add option */}
      {isOwner && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <input
            data-testid="new-option-input"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
            placeholder="New option label…"
            style={{ flex: 1, fontSize: 14, padding: 4 }}
          />
          <button data-testid="add-option-btn" onClick={handleAddOption}>
            Add option
          </button>
        </div>
      )}

      {/* Options list */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {options.map((opt) => {
          const pct = getPercentage(opt.id);
          const isVoted = myVote === opt.id;
          return (
            <li
              key={opt.id}
              style={{
                marginBottom: 12,
                padding: 8,
                border: "1px solid #ddd",
                borderRadius: 6,
                background: isVoted ? "#e8f5e9" : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                {/* Label */}
                <span
                  data-testid={`label-${opt.id}`}
                  style={{ flex: 1, fontWeight: isVoted ? "bold" : "normal" }}
                >
                  {opt.label}
                </span>

                {/* Vote button */}
                <button
                  data-testid={`vote-${opt.id}`}
                  onClick={() => castVote(opt.id)}
                  style={{
                    background: isVoted ? "#4caf50" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  {isVoted ? "Voted" : "Vote"}
                </button>

                {/* Remove button (owner only) */}
                {isOwner && (
                  <button
                    data-testid={`remove-${opt.id}`}
                    onClick={() => removeOption(opt.id)}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Percentage bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "#eee",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#1976d2",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <span
                  data-testid={`bar-${opt.id}`}
                  style={{ minWidth: 36, textAlign: "right", fontSize: 13 }}
                >
                  {pct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Total votes */}
      <p data-testid="total-votes" style={{ fontWeight: "bold" }}>
        Total votes: {totalVotes}
      </p>
    </main>
  );
}

// ─── Room wrapper ────────────────────────────────────────────────────────────
function PollRoom() {
  return (
    <RoomProviderSuspense
      id={ROOM_ID}
      initialPresence={{}}
      initialStorage={{
        poll: new LiveObject({
          question: "",
          options: new LiveList([]),
        }),
        votes: new LiveMap([]),
      }}
    >
      <ClientSideSuspense fallback={<p>Connecting to room…</p>}>
        {() => <PollInner />}
      </ClientSideSuspense>
    </RoomProviderSuspense>
  );
}

// ─── Page content (reads query params, sets userRef, mounts room) ────────────
function PollPageContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "anonymous";
  const name = searchParams.get("name") ?? userId;

  // Set user identity before the room provider mounts
  userRef.userId = userId;
  userRef.name = name;

  return <PollRoom />;
}

// ─── Default export ──────────────────────────────────────────────────────────
export default function PollPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PollPageContent />
    </Suspense>
  );
}
