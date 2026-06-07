"use client";

import { LiveObject } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
} from "@liveblocks/react/suspense";
import { useEffect, useState } from "react";

const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const roomId = `harbor-timer-${runId}`;

function TimerApp() {
  const timer = useStorage((root: any) => root.timer);
  const startEpoch = timer?.startEpoch ?? null;
  const durationMs = timer?.durationMs ?? 60000;
  const running = timer?.running ?? false;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running || startEpoch === null) {
      return;
    }

    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [running, startEpoch]);

  const updateDuration = useMutation(({ storage }, durationSec: number) => {
    const timerObj = storage.get("timer") as any;
    if (timerObj) {
      timerObj.set("durationMs", durationSec * 1000);
    }
  }, []);

  const startTimer = useMutation(({ storage }) => {
    const timerObj = storage.get("timer") as any;
    if (timerObj) {
      timerObj.set("startEpoch", Date.now());
      timerObj.set("running", true);
    }
  }, []);

  const pauseTimer = useMutation(({ storage }) => {
    const timerObj = storage.get("timer") as any;
    if (timerObj) {
      timerObj.set("running", false);
      timerObj.set("startEpoch", null);
    }
  }, []);

  const resetTimer = useMutation(({ storage }) => {
    const timerObj = storage.get("timer") as any;
    if (timerObj) {
      timerObj.set("running", false);
      timerObj.set("startEpoch", null);
    }
  }, []);

  let displayText = "";
  if (running && startEpoch !== null) {
    const elapsed = now - startEpoch;
    const remainingMs = durationMs - elapsed;
    if (remainingMs <= 0) {
      displayText = "DONE";
    } else {
      displayText = String(Math.ceil(remainingMs / 1000));
    }
  } else {
    displayText = String(Math.round(durationMs / 1000));
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Shared Countdown Timer</h1>
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Duration (seconds):</label>
        <input
          type="number"
          data-testid="duration-input"
          value={Math.round(durationMs / 1000)}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            updateDuration(isNaN(val) ? 0 : val);
          }}
          style={{ padding: "0.25rem", width: "80px" }}
        />
      </div>
      <div
        data-testid="timer-display"
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          margin: "1.5rem 0",
          fontFamily: "monospace",
        }}
      >
        {displayText}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          data-testid="start-btn"
          onClick={startTimer}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Start
        </button>
        <button
          data-testid="pause-btn"
          onClick={pauseTimer}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Pause
        </button>
        <button
          data-testid="reset-btn"
          onClick={resetTimer}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          timer: new LiveObject({
            startEpoch: null,
            durationMs: 60000,
            running: false,
          }),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading room...</div>}>
          <TimerApp />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
