"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LiveblocksProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import {
  SuspenseRoomProvider,
  useSuspenseSelf,
  useSuspenseStorage,
  useSuspenseMutation,
} from "../liveblocks.config";

const generateId = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

function PollApp({ userId }: { userId: string }) {
  const me = useSuspenseSelf((me) => me);
  const role = me?.info?.role || "voter";

  const poll = useSuspenseStorage((root) => root.poll);
  const votes = useSuspenseStorage((root) => root.votes);

  // Compute total votes
  const totalVotes = useSuspenseStorage((root) => {
    const votes = root.votes;
    return votes ? votes.size : 0;
  });

  // Compute option percentages
  const optionPercentages = useSuspenseStorage((root) => {
    const votes = root.votes;
    const poll = root.poll;
    const percentages: Record<string, number> = {};
    
    if (!poll || !poll.options) return percentages;
    
    let total = 0;
    const counts: Record<string, number> = {};
    
    for (const opt of poll.options) {
      counts[opt.id] = 0;
    }
    
    if (votes) {
      for (const val of votes.values()) {
        if (counts[val] !== undefined) {
          counts[val]++;
        }
        total++;
      }
    }
    
    for (const opt of poll.options) {
      if (total === 0) {
        percentages[opt.id] = 0;
      } else {
        percentages[opt.id] = Math.round((counts[opt.id] / total) * 100);
      }
    }
    
    return percentages;
  });

  // Mutations
  const updateQuestion = useSuspenseMutation(({ storage }, newQuestion: string) => {
    const poll = storage.get("poll");
    poll.set("question", newQuestion);
  }, []);

  const addOption = useSuspenseMutation(({ storage }, label: string) => {
    const poll = storage.get("poll");
    const options = poll.get("options");
    const id = generateId();
    options.push(new LiveObject({ id, label }));
  }, []);

  const removeOption = useSuspenseMutation(({ storage }, optionId: string) => {
    const poll = storage.get("poll");
    const options = poll.get("options");
    
    let indexToRemove = -1;
    for (let i = 0; i < options.length; i++) {
      if (options.get(i)?.get("id") === optionId) {
        indexToRemove = i;
        break;
      }
    }
    if (indexToRemove !== -1) {
      options.delete(indexToRemove);
    }

    const votes = storage.get("votes");
    // remove any voter's vote for this option
    for (const [voterId, votedOptionId] of votes.entries()) {
      if (votedOptionId === optionId) {
        votes.delete(voterId);
      }
    }
  }, []);

  const castVote = useSuspenseMutation(({ storage }, userId: string, optionId: string) => {
    const votes = storage.get("votes");
    votes.set(userId, optionId);
  }, []);

  // State for new option input
  const [newOptionText, setNewOptionText] = useState("");

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionText.trim()) return;
    addOption(newOptionText.trim());
    setNewOptionText("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ textAlign: "center" }}>⚡ Liveblocks Collaborative Poll ⚡</h1>
      
      <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <h2>Poll Question</h2>
        {role === "owner" ? (
          <input
            type="text"
            data-testid="question-input"
            value={poll?.question || ""}
            onChange={(e) => updateQuestion(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: "1.1rem", boxSizing: "border-box" }}
            placeholder="Type your poll question here..."
          />
        ) : (
          <input
            type="text"
            data-testid="question-input"
            value={poll?.question || ""}
            disabled
            readOnly
            style={{ width: "100%", padding: 10, fontSize: "1.1rem", boxSizing: "border-box", backgroundColor: "#f0f0f0" }}
          />
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2>Options</h2>
        {poll?.options && poll.options.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {poll.options.map((opt: any) => {
              const optionId = opt.id;
              const percentage = optionPercentages[optionId] || 0;
              const isMyVote = votes?.get(userId) === optionId;

              return (
                <div key={optionId} style={{ border: "1px solid #eee", padding: 16, borderRadius: 8, position: "relative", overflow: "hidden" }}>
                  {/* Background Percentage Bar */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: "rgba(0, 150, 255, 0.15)",
                      transition: "width 0.3s ease",
                      zIndex: 1,
                    }}
                  />
                  
                  <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span data-testid={`label-${optionId}`} style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                        {opt.label}
                      </span>
                      <span
                        data-testid={`bar-${optionId}`}
                        style={{ marginLeft: 12, padding: "2px 6px", backgroundColor: "#0096ff", color: "white", borderRadius: 4, fontSize: "0.9rem" }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        data-testid={`vote-${optionId}`}
                        onClick={() => castVote(userId, optionId)}
                        style={{
                          padding: "8px 16px",
                          cursor: "pointer",
                          backgroundColor: isMyVote ? "#4CAF50" : "#fff",
                          color: isMyVote ? "#fff" : "#333",
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          fontWeight: isMyVote ? "bold" : "normal",
                        }}
                      >
                        {isMyVote ? "Voted" : "Vote"}
                      </button>

                      {role === "owner" && (
                        <button
                          data-testid={`remove-${optionId}`}
                          onClick={() => removeOption(optionId)}
                          style={{
                            padding: "8px 16px",
                            cursor: "pointer",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontStyle: "italic", color: "#666" }}>No options added yet.</p>
        )}
      </div>

      {role === "owner" && (
        <form onSubmit={handleAddOption} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>Add Option</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              data-testid="new-option-input"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="New option label..."
              style={{ flex: 1, padding: 10, boxSizing: "border-box" }}
            />
            <button
              type="submit"
              data-testid="add-option-btn"
              style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#008CBA", color: "white", border: "none", borderRadius: 4 }}
            >
              Add option
            </button>
          </div>
        </form>
      )}

      <div style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", marginTop: 24 }} data-testid="total-votes">
        Total votes: {totalVotes}
      </div>
    </div>
  );
}

function PollPageContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const name = searchParams.get("name") || "";

  if (!userId || !name) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Liveblocks Collaborative Poll</h1>
        <p style={{ color: "red" }}>
          Error: Please provide <strong>userId</strong> and <strong>name</strong> in the URL query parameters.
        </p>
        <p>Example: <code>/?userId=alice&name=Alice</code></p>
      </div>
    );
  }

  const roomId = `poll-room-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local"}`;

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            name,
            room,
          }),
        });
        return await response.json();
      }}
    >
      <SuspenseRoomProvider
        id={roomId}
        initialStorage={{
          poll: new LiveObject({
            question: "",
            options: new LiveList<LiveObject<{ id: string; label: string }>>([]),
          }),
          votes: new LiveMap<string, string>(),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading room storage...</div>}>
          {() => <PollApp userId={userId} />}
        </ClientSideSuspense>
      </SuspenseRoomProvider>
    </LiveblocksProvider>
  );
}

export default function PollPage() {
  return (
    <Suspense fallback={<div>Loading parameters...</div>}>
      <PollPageContent />
    </Suspense>
  );
}
