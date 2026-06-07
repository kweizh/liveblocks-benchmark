"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { useState, useEffect, useCallback, FormEvent } from "react";

function Dashboard() {
  const [identity, setIdentity] = useState<string>("anonymous");
  const [newKey, setNewKey] = useState("");
  const [newInitial, setNewInitial] = useState("0");

  // Load identity from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("liveblocks-identity");
      if (stored) {
        setIdentity(stored);
      }
    }
  }, []);

  const handleIdentityChange = useCallback(
    (value: string) => {
      setIdentity(value);
      if (typeof window !== "undefined") {
        localStorage.setItem("liveblocks-identity", value);
      }
    },
    []
  );

  const counters = useStorage((root) => root.counters);

  const createCounter = useMutation(
    ({ storage }, key: string, initialValue: number, who: string) => {
      const map = storage.get("counters");
      if (map.get(key) !== undefined) {
        // Key already exists – do not overwrite
        return;
      }
      map.set(
        key,
        new LiveObject({
          value: initialValue,
          lastIncrementBy: who,
          lastUpdated: Date.now(),
        })
      );
    },
    []
  );

  const increment = useMutation(
    ({ storage }, key: string, who: string) => {
      const map = storage.get("counters");
      const obj = map.get(key);
      if (!obj) return;
      obj.set("value", obj.get("value") + 1);
      obj.set("lastIncrementBy", who);
      obj.set("lastUpdated", Date.now());
    },
    []
  );

  const decrement = useMutation(
    ({ storage }, key: string, who: string) => {
      const map = storage.get("counters");
      const obj = map.get(key);
      if (!obj) return;
      obj.set("value", obj.get("value") - 1);
      obj.set("lastIncrementBy", who);
      obj.set("lastUpdated", Date.now());
    },
    []
  );

  const resetAll = useMutation(
    ({ storage }, who: string) => {
      const map = storage.get("counters");
      const now = Date.now();
      map.forEach((obj) => {
        obj.set("value", 0);
        obj.set("lastIncrementBy", who);
        obj.set("lastUpdated", now);
      });
    },
    []
  );

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const key = newKey.trim();
    if (!key) return;
    const initialValue = parseInt(newInitial, 10);
    createCounter(key, isNaN(initialValue) ? 0 : initialValue, identity || "anonymous");
    setNewKey("");
    setNewInitial("0");
  };

  const entries = counters ? Array.from(counters.entries()) : [];

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Collaborative Counter Dashboard</h1>

      {/* Identity input */}
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="identity-input" style={{ marginRight: 8 }}>
          Your identity:
        </label>
        <input
          id="identity-input"
          data-testid="identity-input"
          type="text"
          value={identity}
          onChange={(e) => handleIdentityChange(e.target.value)}
          placeholder="Enter your name"
          style={{ padding: "4px 8px", minWidth: 200 }}
        />
      </div>

      {/* Create counter form */}
      <form onSubmit={handleCreate} style={{ marginBottom: 32, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          data-testid="new-counter-key"
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Counter name"
          style={{ padding: "4px 8px", minWidth: 160 }}
        />
        <input
          data-testid="new-counter-initial"
          type="number"
          value={newInitial}
          onChange={(e) => setNewInitial(e.target.value)}
          placeholder="Initial value"
          style={{ padding: "4px 8px", width: 120 }}
        />
        <button
          data-testid="create-counter"
          type="submit"
          style={{ padding: "4px 16px", cursor: "pointer" }}
        >
          Create counter
        </button>
      </form>

      {/* Counter rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map(([key, counter]) => (
          <div
            key={key}
            data-testid="counter-row"
            data-counter-key={key}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 400,
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: 18 }}>{key}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span data-testid="counter-value" style={{ fontSize: 24, minWidth: 48, textAlign: "center" }}>
                {counter.value}
              </span>
              <button
                data-testid="increment"
                onClick={() => increment(key, identity || "anonymous")}
                style={{ padding: "4px 12px", cursor: "pointer" }}
              >
                Increment
              </button>
              <button
                data-testid="decrement"
                onClick={() => decrement(key, identity || "anonymous")}
                style={{ padding: "4px 12px", cursor: "pointer" }}
              >
                Decrement
              </button>
            </div>
            <div data-testid="last-touched" style={{ fontSize: 13, color: "#555" }}>
              Last touched by {counter.lastIncrementBy} at{" "}
              {new Date(counter.lastUpdated).toISOString()}
            </div>
          </div>
        ))}
      </div>

      {/* Reset all button */}
      {entries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            data-testid="reset-all"
            onClick={() => resetAll(identity || "anonymous")}
            style={{ padding: "8px 24px", cursor: "pointer", background: "#e55", color: "#fff", border: "none", borderRadius: 6 }}
          >
            Reset all
          </button>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <Dashboard />
    </Room>
  );
}
