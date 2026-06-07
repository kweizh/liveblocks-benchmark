"use client";

import { useEffect, useState } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { Room } from "./Room";

function Stopwatch() {
  const stopwatch = useStorage((root) => root.stopwatch);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const start = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw.get("running")) {
      sw.set("running", true);
      sw.set("startedAt", Date.now());
    }
  }, []);

  const stop = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (sw.get("running")) {
      const startedAt = sw.get("startedAt");
      const accumulatedMs = sw.get("accumulatedMs");
      if (startedAt !== null) {
        sw.set("accumulatedMs", accumulatedMs + (Date.now() - startedAt));
      }
      sw.set("running", false);
      sw.set("startedAt", null);
    }
  }, []);

  const reset = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    sw.set("running", false);
    sw.set("startedAt", null);
    sw.set("accumulatedMs", 0);
  }, []);

  let elapsed = stopwatch.accumulatedMs;
  if (stopwatch.running && stopwatch.startedAt !== null) {
    elapsed += tick - stopwatch.startedAt;
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <div style={{ marginBottom: 16 }}>
        Status: <span id="stopwatch-state">{stopwatch.running ? "running" : "stopped"}</span>
      </div>
      <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: 16 }}>
        <span id="stopwatch-elapsed-ms">{Math.floor(elapsed)}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button id="stopwatch-start" onClick={start}>Start</button>
        <button id="stopwatch-stop" onClick={stop}>Stop</button>
        <button id="stopwatch-reset" onClick={reset}>Reset</button>
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
