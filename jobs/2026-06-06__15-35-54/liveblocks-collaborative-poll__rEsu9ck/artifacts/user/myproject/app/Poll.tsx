"use client";

import { useState, useEffect } from "react";
import { LiveMap } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { useStorage, useMutation } from "../liveblocks.config";

type PollProps = {
  publicApiKey: string;
  roomId: string;
};

const OPTIONS = ["react", "vue", "svelte", "solid"] as const;

function getVoteCount(votes: any, option: string): number {
  if (!votes) return 0;
  if (typeof votes.get === "function") {
    return votes.get(option) ?? 0;
  }
  return votes[option] ?? 0;
}

function PollContent() {
  const votes = useStorage((root) => root.votes);

  const incrementVote = useMutation(({ storage }, optionId: string) => {
    const votesMap = storage.get("votes");
    if (votesMap) {
      votesMap.set(optionId, (votesMap.get(optionId) ?? 0) + 1);
    }
  }, []);

  if (!votes) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>What is your favorite frontend framework?</h1>
        <p>Loading poll...</p>
      </div>
    );
  }

  // Calculate total votes
  let totalVotes = 0;
  OPTIONS.forEach((option) => {
    totalVotes += getVoteCount(votes, option);
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>What is your favorite frontend framework?</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {OPTIONS.map((option) => {
          const count = getVoteCount(votes, option);
          return (
            <div
              key={option}
              style={{
                border: "1px solid #eaeaea",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "1.2rem", textTransform: "capitalize" }}>
                  {option}
                </span>
                <span style={{ fontSize: "1.1rem", color: "#666" }}>
                  {count}
                </span>
              </div>
              
              <progress
                max={totalVotes}
                value={count}
                style={{ width: "100%", height: "12px", borderRadius: "6px" }}
              />

              <div style={{ marginTop: "0.5rem" }}>
                <button
                  onClick={() => incrementVote(option)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "6px",
                    border: "1px solid #0070f3",
                    backgroundColor: "#0070f3",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Vote {option}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Poll({ publicApiKey, roomId }: PollProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const initialStorage = {
    votes: new LiveMap<string, number>([
      ["react", 0],
      ["vue", 0],
      ["svelte", 0],
      ["solid", 0],
    ]),
  };

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id={roomId} initialStorage={initialStorage}>
        <PollContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
