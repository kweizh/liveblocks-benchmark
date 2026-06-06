"use client";

import { useSearchParams } from "next/navigation";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { Suspense, useState } from "react";
import "../liveblocks.config"; // Ensure the types are loaded

function PollApp() {
  const role = useSelf((me) => me.info?.role);
  const meId = useSelf((me) => me.id);
  
  const poll = useStorage((root) => root.poll) as any;
  const votesData = useStorage((root) => {
    const votes = root.votes as any;
    if (!votes) return { totalVotes: 0, optionCounts: {} as Record<string, number> };
    
    const totalVotes = votes.size;
    const optionCounts: Record<string, number> = {};
    for (const [userId, optionId] of votes.entries()) {
      optionCounts[optionId] = (optionCounts[optionId] || 0) + 1;
    }
    return { totalVotes, optionCounts };
  });
  const { totalVotes, optionCounts } = votesData;
  
  const isOwner = role === "owner";
  
  // Mutations
  const updateQuestion = useMutation(({ storage }, newQuestion: string) => {
    const poll = storage.get("poll") as any;
    poll.set("question", newQuestion);
  }, []);

  const addOption = useMutation(({ storage }, label: string) => {
    const poll = storage.get("poll") as any;
    const options = poll.get("options");
    options.push(
      new LiveObject({
        id: crypto.randomUUID(),
        label,
      })
    );
  }, []);

  const removeOption = useMutation(({ storage }, optionId: string) => {
    const poll = storage.get("poll") as any;
    const options = poll.get("options");
    const index = options.findIndex((opt: any) => opt.get("id") === optionId);
    if (index !== -1) {
      options.delete(index);
    }
  }, []);

  const vote = useMutation(({ storage }, optionId: string) => {
    const votes = storage.get("votes") as any;
    votes.set(meId, optionId);
  }, [meId]);

  const [newOptionLabel, setNewOptionLabel] = useState("");

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h1>Liveblocks Collaborative Poll</h1>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Question</label>
        {isOwner ? (
          <input
            data-testid="question-input"
            value={poll.question}
            onChange={(e) => updateQuestion(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        ) : (
          <input
            data-testid="question-input"
            value={poll.question}
            readOnly
            disabled
            style={{ width: "100%", padding: 8 }}
          />
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Options</h2>
        {poll?.options?.map((option: any) => {
          const count = optionCounts[option.id] || 0;
          const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          
          return (
            <div key={option.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 8, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span data-testid={`label-${option.id}`}>{option.label}</span>
                <div>
                  <span data-testid={`bar-${option.id}`} style={{ marginRight: 12, fontWeight: "bold" }}>
                    {percentage}%
                  </span>
                  <button 
                    data-testid={`vote-${option.id}`}
                    onClick={() => vote(option.id)}
                    style={{ marginRight: isOwner ? 8 : 0 }}
                  >
                    Vote
                  </button>
                  {isOwner && (
                    <button
                      data-testid={`remove-${option.id}`}
                      onClick={() => removeOption(option.id)}
                      style={{ color: "red" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div style={{ background: "#eee", height: 10, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ background: "#0070f3", height: "100%", width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {isOwner && (
        <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
          <input
            data-testid="new-option-input"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="New option label"
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
            style={{ padding: "8px 16px" }}
          >
            Add option
          </button>
        </div>
      )}

      <div data-testid="total-votes" style={{ marginTop: 20, fontWeight: "bold" }}>
        Total votes: {totalVotes}
      </div>
    </main>
  );
}

function PollPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "anonymous";
  const name = searchParams.get("name") || "Anonymous";

  const roomId = `poll-room-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local"}`;

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, name }),
        });
        return await response.json();
      }}
    >
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
          <PollApp />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading app...</div>}>
      <PollPage />
    </Suspense>
  );
}
