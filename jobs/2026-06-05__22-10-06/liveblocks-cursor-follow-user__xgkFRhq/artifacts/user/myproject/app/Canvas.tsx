"use client";

import { useRef } from "react";

// Initial scaffold:
//  - Renders a 4000x4000 scrollable canvas.
//  - The executor MUST extend this component to:
//      * broadcast scroll position as Presence.viewport via useMyPresence
//      * follow another user (scroll to their viewport) when their avatar is clicked
//      * render a `[data-testid="stop-following"]` badge in follow mode
export function Canvas() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      data-testid="canvas"
      style={{
        flex: 1,
        overflow: "auto",
        position: "relative",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          width: 4000,
          height: 4000,
          position: "relative",
          backgroundImage:
            "linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
