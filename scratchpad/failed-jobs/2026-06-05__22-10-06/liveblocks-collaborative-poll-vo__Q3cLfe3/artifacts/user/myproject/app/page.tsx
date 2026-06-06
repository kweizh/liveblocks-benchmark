"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { RoomProvider, useStorage, useMutation, useSelf } from "../liveblocks.config";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";

function Poll() {
  const role = useSelf((me) => me.info.role);
  const userId = useSelf((me) => me.id);
  const poll = useStorage((root) => root.poll);
  const votes = useStorage((root) => root.votes);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const updateQuestion = useMutation(({ storage }, newQuestion: string) => {
    storage.get("poll").set("question", newQuestion);
  }, []);

  const addOption = useMutation(({ storage }, label: string) => {
    const id = crypto.randomUUID();
    storage.get("poll").get("options").push(new LiveObject({ id, label }));
  }, []);

  const removeOption = useMutation(({ storage }, optionId: string) => {
    const options = storage.get("poll").get("options");
    const index = options.findIndex((opt) => opt.get("id") === optionId);
    if (index !== -1) {
      options.delete(index);
    }
    // Clean up votes for this option
    const votesMap = storage.get("votes");
    for (const [voterId, votedOptionId] of votesMap.entries()) {
      if (votedOptionId === optionId) {
        votesMap.delete(voterId);
      }
    }
  }, []);

  const castVote = useMutation(({ storage }, optionId: string) => {
    if (userId) {
      storage.get("votes").set(userId, optionId);
    }
  }, [userId]);

  const totalVotes = votes ? Array.from(votes.keys()).length : 0;

  const getPercentage = (optionId: string) => {
    if (totalVotes === 0 || !votes) return 0;
    let count = 0;
    for (const votedOptionId of votes.values()) {
      if (votedOptionId === optionId) {
        count++;
      }
    }
    return Math.round((count / totalVotes) * 100);
  };

  if (!poll || !votes) return null;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        {role === "owner" ? (
          <input
            data-testid="question-input"
            value={poll.question}
            onChange={(e) => updateQuestion(e.target.value)}
            placeholder="Poll Question"
            style={{ width: "100%", fontSize: "1.5rem", padding: 8 }}
          />
        ) : (
          <h1 data-testid="question-display">{poll.question || "Untitled Poll"}</h1>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        {poll.options.map((option) => {
          const opt = option; // In newer Liveblocks it might be a LiveObject directly or plain object depending on how you read it
          const id = opt.id;
          const label = opt.label;
          const percentage = getPercentage(id);

          return (
            <div key={id} style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span data-testid={`label-${id}`} style={{ fontWeight: "bold" }}>{label}</span>
                <span data-testid={`bar-${id}`}>{percentage}%</span>
              </div>
              <div style={{ background: "#eee", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ background: "#0070f3", height: "100%", width: `${percentage}%`, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button data-testid={`vote-${id}`} onClick={() => castVote(id)}>Vote</button>
                {role === "owner" && (
                  <button data-testid={`remove-${id}`} onClick={() => removeOption(id)}>Remove</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {role === "owner" && (
        <div style={{ marginBottom: 24, display: "flex", gap: 8 }}>
          <input
            data-testid="new-option-input"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="New option"
            style={{ flex: 1, padding: 8 }}
          />
          <button
            data-testid="add-option-btn"
            onClick={() => {
              if (newOptionLabel.trim()) {
                addOption(newOptionLabel.trim());
                setNewOptionLabel("");
              }
            }}
          >
            Add option
          </button>
        </div>
      )}

      <div data-testid="total-votes" style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
        Total votes: {totalVotes}
      </div>
    </div>
  );
}

function PollPageContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const name = searchParams.get("name");

  if (!userId || !name) {
    return <div>Missing userId or name in query parameters.</div>;
  }

  const roomId = `poll-room-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          poll: new LiveObject({
            question: "",
            options: new LiveList([]),
          }),
          votes: new LiveMap(),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {() => <Poll />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default function PollPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PollPageContent />
    </Suspense>
  );
}
