"use client";

import { useState, useEffect } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import { Room } from "./Room";

function Stopwatch() {
  const stopwatch = useStorage((root) => root.stopwatch);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!stopwatch || !stopwatch.running) {
      return;
    }

    const interval = setInterval(() => {
      setTick(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [stopwatch?.running]);

  if (!stopwatch) {
    return null;
  }

  const { running, startedAt, accumulatedMs } = stopwatch;

  const elapsedMs = running && startedAt !== null
    ? accumulatedMs + (Date.now() - startedAt)
    : accumulatedMs;

  const elapsedMsInt = Math.floor(elapsedMs);

  const startStopwatch = useMutation(({ storage }) => {
    const stopwatchObj = storage.get("stopwatch");
    if (!stopwatchObj.get("running")) {
      stopwatchObj.set("running", true);
      stopwatchObj.set("startedAt", Date.now());
    }
  }, []);

  const stopStopwatch = useMutation(({ storage }) => {
    const stopwatchObj = storage.get("stopwatch");
    if (stopwatchObj.get("running")) {
      const startedAtVal = stopwatchObj.get("startedAt");
      if (startedAtVal !== null) {
        const elapsed = Date.now() - startedAtVal;
        stopwatchObj.set("accumulatedMs", stopwatchObj.get("accumulatedMs") + elapsed);
      }
      stopwatchObj.set("running", false);
      stopwatchObj.set("startedAt", null);
    }
  }, []);

  const resetStopwatch = useMutation(({ storage }) => {
    const stopwatchObj = storage.get("stopwatch");
    stopwatchObj.set("running", false);
    stopwatchObj.set("startedAt", null);
    stopwatchObj.set("accumulatedMs", 0);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Collaborative Shared Stopwatch</h1>
      <div style={{ marginBottom: 16 }}>
        <strong>State: </strong>
        <span id="stopwatch-state">{running ? "running" : "stopped"}</span>
      </div>
      <div style={{ marginBottom: 24, fontSize: "2rem" }}>
        <strong>Elapsed Time: </strong>
        <span id="stopwatch-elapsed-ms">{elapsedMsInt}</span>
      </div>
      <div>
        <button id="stopwatch-start" onClick={startStopwatch} style={{ marginRight: 8 }}>
          Start
        </button>
        <button id="stopwatch-stop" onClick={stopStopwatch} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button id="stopwatch-reset" onClick={resetStopwatch}>
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
