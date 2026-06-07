"use client";

import { ReactNode } from "react";
import { LiveblocksProvider } from "../liveblocks.config";

export function Providers({ children }: { children: ReactNode }) {
  return <LiveblocksProvider>{children}</LiveblocksProvider>;
}
