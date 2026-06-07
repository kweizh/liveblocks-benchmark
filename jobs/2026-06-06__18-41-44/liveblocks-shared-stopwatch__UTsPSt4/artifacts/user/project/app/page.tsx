"use client";

import { useEffect, useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { Room } from "./Room";

function Stopwatch() {
  const stopwatch = useStorage((root) => root.stopwatch);
  const [, setTick] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stopwatch?.running) {
      interval = setInterval(() => {
        setTick(Date.now());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [stopwatch?.running]);

  const start = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw) return;
    const running = sw.get("running");
    if (!running) {
      sw.set("running", true);
      sw.set("startedAt", Date.now());
    }
  }, []);

  const stop = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw) return;
    const running = sw.get("running");
    if (running) {
      const startedAt = sw.get("startedAt");
      const accumulatedMs = sw.get("accumulatedMs");
      sw.set("running", false);
      if (startedAt !== null) {
        sw.set("accumulatedMs", accumulatedMs + (Date.now() - startedAt));
      }
      sw.set("startedAt", null);
    }
  }, []);

  const reset = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw) return;
    sw.set("running", false);
    sw.set("startedAt", null);
    sw.set("accumulatedMs", 0);
  }, []);

  const elapsedMs = stopwatch?.running && stopwatch?.startedAt !== null
    ? (stopwatch?.accumulatedMs || 0) + (Date.now() - stopwatch.startedAt)
    : (stopwatch?.accumulatedMs || 0);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <div>
        State: <span id="stopwatch-state">{stopwatch?.running ? "running" : "stopped"}</span>
      </div>
      <div>
        Elapsed: <span id="stopwatch-elapsed-ms">{Math.floor(elapsedMs)}</span>
      </div>
      <div>
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
