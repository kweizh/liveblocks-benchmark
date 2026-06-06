"use client";

import { useSelf, useOthers } from "@liveblocks/react/suspense";
import { useState } from "react";

function Avatar({
  userId,
  info,
  isSelf,
  zIndex,
}: {
  userId: string;
  info?: { name: string; avatar: string; color: string };
  isSelf?: boolean;
  zIndex: number;
}) {
  const [imgError, setImgError] = useState(false);
  const name = info?.name || "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tooltipText = isSelf ? `${name} (You)` : name;

  return (
    <div
      data-testid="avatar-item"
      data-user-id={userId}
      data-self={isSelf ? "true" : undefined}
      style={{
        position: "relative",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `2px solid ${info?.color || "#ccc"}`,
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: zIndex === 100 ? 0 : -8, // First item has no negative margin
        cursor: "pointer",
        zIndex,
      }}
      className="avatar-wrapper"
    >
      {info?.avatar && !imgError ? (
        <img
          src={info.avatar}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{initials}</span>
      )}

      {/* Online dot */}
      <div
        data-testid="online-dot"
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "#22c55e",
          border: "2px solid #fff",
        }}
      />

      {/* Tooltip */}
      <div
        data-testid="avatar-tooltip"
        className="avatar-tooltip"
        style={{
          position: "absolute",
          bottom: -30,
          whiteSpace: "nowrap",
          backgroundColor: "#1f2937",
          color: "#fff",
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 4,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
      >
        {tooltipText}
      </div>
    </div>
  );
}

export function Header() {
  const self = useSelf();
  const others = useOthers();

  // If for some reason self is null (e.g. not connected yet in non-suspense mode)
  if (!self) {
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
        <div data-testid="header-right">
          <div data-testid="avatar-stack" style={{ display: "flex", alignItems: "center" }}>
            {/* Skeleton */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e5e7eb" }} />
          </div>
        </div>
      </header>
    );
  }

  const sortedOthers = [...others].sort((a, b) => a.connectionId - b.connectionId);
  const allUsers = [self, ...sortedOthers];

  const displayUsers = allUsers.slice(0, 4);
  const overflowCount = allUsers.length > 4 ? allUsers.length - 4 : 0;

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
      <div data-testid="header-right">
        <div
          data-testid="avatar-stack"
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <style>{`
            .avatar-wrapper:hover .avatar-tooltip {
              opacity: 1 !important;
            }
          `}</style>
          
          {displayUsers.map((user, index) => {
            const isSelf = user.id === self.id && user.connectionId === self.connectionId;
            return (
              <Avatar
                key={user.connectionId}
                userId={user.id}
                info={user.info}
                isSelf={isSelf}
                zIndex={100 - index}
              />
            );
          })}

          {overflowCount > 0 && (
            <div
              data-testid="avatar-overflow"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#e5e7eb",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: -8,
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                zIndex: 0,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
