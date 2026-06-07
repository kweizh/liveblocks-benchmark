import { useStorage } from "@liveblocks/react";
import type { Storage } from "./liveblocks.config";

function Test() {
  const stopwatch = useStorage((root: any) => root.stopwatch);
  console.log(stopwatch.running);
}
