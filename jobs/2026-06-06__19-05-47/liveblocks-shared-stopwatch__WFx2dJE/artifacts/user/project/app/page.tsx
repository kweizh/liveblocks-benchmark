"use client";

import { useEffect, useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { Room } from "./Room";

function Stopwatch() {
  const stopwatch = useStorage((root) => root.stopwatch);
  const [tick, setTick] = useState(Date.now());

  // Live-updating elapsed time: re-render every 100ms while running
  useEffect(() => {
    if (!stopwatch.running) return;
    const id = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [stopwatch.running]);

  // Derive the displayed elapsed milliseconds
  const elapsedMs = stopwatch.running
    ? stopwatch.accumulatedMs + (Date.now() - (stopwatch.startedAt ?? Date.now()))
    : stopwatch.accumulatedMs;

  const start = useMutation(
    ({ storage }) => {
      const sw = storage.get("stopwatch");
      if (sw.get("running")) return; // don't reset startedAt if already running
      sw.set("startedAt", Date.now());
      sw.set("running", true);
    },
    []
  );

  const stop = useMutation(
    ({ storage }) => {
      const sw = storage.get("stopwatch");
      if (!sw.get("running")) return; // already stopped, do nothing
      const startedAt = sw.get("startedAt");
      sw.set("accumulatedMs", sw.get("accumulatedMs") + (Date.now() - (startedAt ?? Date.now())));
      sw.set("startedAt", null);
      sw.set("running", false);
    },
    []
  );

  const reset = useMutation(
    ({ storage }) => {
      const sw = storage.get("stopwatch");
      sw.set("running", false);
      sw.set("startedAt", null);
      sw.set("accumulatedMs", 0);
    },
    []
  );

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <p>
        State: <span id="stopwatch-state">{stopwatch.running ? "running" : "stopped"}</span>
      </p>
      <p>
        Elapsed: <span id="stopwatch-elapsed-ms">{Math.floor(elapsedMs)}</span>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button id="stopwatch-start" onClick={start}>
          Start
        </button>
        <button id="stopwatch-stop" onClick={stop}>
          Stop
        </button>
        <button id="stopwatch-reset" onClick={reset}>
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