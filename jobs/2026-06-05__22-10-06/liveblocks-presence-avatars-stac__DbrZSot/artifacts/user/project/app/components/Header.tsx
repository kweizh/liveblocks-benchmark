"use client";

import { useSelf, useOthers } from "@liveblocks/react/suspense";
import React from "react";

const MAX_AVATARS = 4;

export function Header() {
  const self = useSelf();
  const others = useOthers();

  const allUsers = [
    self,
    ...[...others].sort((a, b) => a.connectionId - b.connectionId),
  ];

  const visibleUsers = allUsers.slice(0, MAX_AVATARS);
  const overflowCount = allUsers.length - MAX_AVATARS;

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
      <div
        data-testid="avatar-stack"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {visibleUsers.map((user, i) => {
          const isSelf = user.connectionId === self.connectionId;
          return (
            <div
              key={user.connectionId}
              data-testid="avatar-item"
              data-user-id={user.id}
              data-self={isSelf ? "true" : undefined}
              className="avatar-item"
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: "50%",
                marginLeft: i === 0 ? 0 : -8,
                zIndex: visibleUsers.length - i,
                border: `2px solid ${user.info.color}`,
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: user.info.color,
                boxSizing: "border-box",
              }}
            >
              {user.info.avatar ? (
                <img
                  src={user.info.avatar}
                  alt={user.info.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span style={{ position: "absolute" }}>
                {user.info.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>

              <div
                data-testid="online-dot"
                style={{
                  position: "absolute",
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  border: "2px solid #fff",
                }}
              />

              <div
                data-testid="avatar-tooltip"
                className="avatar-tooltip"
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  opacity: 0,
                  transition: "opacity 0.1s ease-in-out",
                  zIndex: 100,
                }}
              >
                {user.info.name}
                {isSelf ? " (You)" : ""}
              </div>
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div
            data-testid="avatar-overflow"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              marginLeft: -8,
              backgroundColor: "#f3f4f6",
              border: "2px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#4b5563",
              zIndex: 0,
              boxSizing: "border-box",
            }}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      <style jsx>{`
        .avatar-item:hover .avatar-tooltip {
          opacity: 1;
        }
      `}</style>
    </header>
  );
}
