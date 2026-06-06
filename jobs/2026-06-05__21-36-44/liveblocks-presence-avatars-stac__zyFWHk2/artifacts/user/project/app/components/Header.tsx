"use client";

import { AvatarStack } from "./AvatarStack";

export function Header() {
  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 600 }}>Presence Avatars</div>
      <AvatarStack />
    </header>
  );
}
