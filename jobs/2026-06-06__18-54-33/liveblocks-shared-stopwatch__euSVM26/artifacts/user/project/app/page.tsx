"use client";

import { useEffect, useState, useCallback } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { Room } from "./Room";

function Stopwatch() {
  const stopwatch = useStorage((root) => root.stopwatch);
  const [, setTick] = useState(0);

  // Update the displayed elapsed time every 100ms when running
  useEffect(() => {
    if (!stopwatch?.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [stopwatch?.running]);

  const handleStart = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (sw.get("running")) return; // already running
    sw.set("running", true);
    sw.set("startedAt", Date.now());
  }, []);

  const handleStop = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw.get("running")) return; // already stopped
    const startedAt = sw.get("startedAt") as number;
    const accumulated = sw.get("accumulatedMs") as number;
    sw.set("running", false);
    sw.set("accumulatedMs", accumulated + (Date.now() - startedAt));
    sw.set("startedAt", null);
  }, []);

  const handleReset = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    sw.set("running", false);
    sw.set("startedAt", null);
    sw.set("accumulatedMs", 0);
  }, []);

  if (!stopwatch) {
    return <div>Loading stopwatch…</div>;
  }

  const { running, startedAt, accumulatedMs } = stopwatch;

  const elapsedMs = running && startedAt != null
    ? accumulatedMs + (Date.now() - startedAt)
    : accumulatedMs;

  const displayMs = Math.floor(elapsedMs);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <p>
        State: <span id="stopwatch-state">{running ? "running" : "stopped"}</span>
      </p>
      <p>
        Elapsed: <span id="stopwatch-elapsed-ms">{displayMs}</span> ms
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button id="stopwatch-start" onClick={handleStart}>
          Start
        </button>
        <button id="stopwatch-stop" onClick={handleStop}>
          Stop
        </button>
        <button id="stopwatch-reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </main>
  );
}

export default function HomePage() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
  const roomId = `stopwatch-${runId}`;

  return (
    <Room roomId={roomId}>
      <Stopwatch />
    </Room>
  );
}
