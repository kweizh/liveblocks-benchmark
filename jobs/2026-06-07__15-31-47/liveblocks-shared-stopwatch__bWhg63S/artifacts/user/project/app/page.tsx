"use client";

import { useEffect, useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { Room } from "./Room";

function Stopwatch() {
  const [tick, setTick] = useState(Date.now());

  // Subscribe to storage snapshot
  const stopwatch = useStorage((root) => root.stopwatch);

  // Tick every 100ms to update the elapsed display when running
  useEffect(() => {
    if (!stopwatch?.running) return;
    const id = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [stopwatch?.running]);

  const start = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (sw.get("running")) return; // already running, do nothing
    sw.set("running", true);
    sw.set("startedAt", Date.now());
  }, []);

  const stop = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    if (!sw.get("running")) return; // already stopped, do nothing
    const startedAt = sw.get("startedAt") as number;
    const accumulated = sw.get("accumulatedMs") as number;
    sw.set("running", false);
    sw.set("accumulatedMs", accumulated + (Date.now() - startedAt));
    sw.set("startedAt", null);
  }, []);

  const reset = useMutation(({ storage }) => {
    const sw = storage.get("stopwatch");
    sw.set("running", false);
    sw.set("startedAt", null);
    sw.set("accumulatedMs", 0);
  }, []);

  if (!stopwatch) return <div>Loading…</div>;

  const { running, startedAt, accumulatedMs } = stopwatch;

  const elapsedMs = running && startedAt != null
    ? Math.floor(accumulatedMs + (tick - startedAt))
    : Math.floor(accumulatedMs);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <p>
        State: <span id="stopwatch-state">{running ? "running" : "stopped"}</span>
      </p>
      <p>
        Elapsed: <span id="stopwatch-elapsed-ms">{elapsedMs}</span> ms
      </p>
      <button id="stopwatch-start" onClick={start}>Start</button>{" "}
      <button id="stopwatch-stop" onClick={stop}>Stop</button>{" "}
      <button id="stopwatch-reset" onClick={reset}>Reset</button>
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
