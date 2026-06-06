"use client";

import { useSelf, useOthers } from "@liveblocks/react/suspense";
import { useState } from "react";

const AVATAR_SIZE = 36;
const MAX_VISIBLE = 4;
const OVERLAP = 8;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AvatarProps {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  isSelf: boolean;
}

function Avatar({ userId, name, avatar, color, isSelf }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const tooltipText = isSelf ? `${name} (You)` : name;

  return (
    <div
      data-testid="avatar-item"
      data-user-id={userId}
      {...(isSelf ? { "data-self": "true" } : {})}
      style={{ position: "relative", width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <div
        data-testid="avatar-tooltip"
        role="tooltip"
        style={{
          position: "absolute",
          bottom: `calc(100% + 6px)`,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1f2937",
          color: "#fff",
          fontSize: 12,
          whiteSpace: "nowrap",
          padding: "3px 8px",
          borderRadius: 4,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          zIndex: 9999,
        }}
      >
        {tooltipText}
      </div>

      {/* Avatar circle */}
      <div
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: "50%",
          border: `2.5px solid ${color}`,
          overflow: "hidden",
          backgroundColor: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          cursor: "default",
          boxSizing: "border-box",
        }}
      >
        {!imgError && avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {/* Online dot */}
      <div
        data-testid="online-dot"
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "#22c55e",
          border: "2px solid #fff",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export function AvatarStack() {
  const self = useSelf();
  const others = useOthers();

  if (!self) return null;

  // Sort others by connectionId ascending for stable ordering across clients
  const sortedOthers = [...others].sort((a, b) => a.connectionId - b.connectionId);

  // Build the full ordered list: self first, then others
  const allUsers = [
    {
      userId: self.id,
      name: self.info?.name ?? "Unknown",
      avatar: self.info?.avatar ?? "",
      color: self.info?.color ?? "#6b7280",
      isSelf: true,
    },
    ...sortedOthers.map((other) => ({
      userId: other.id,
      name: other.info?.name ?? "Unknown",
      avatar: other.info?.avatar ?? "",
      color: other.info?.color ?? "#6b7280",
      isSelf: false,
    })),
  ];

  const visibleUsers = allUsers.slice(0, MAX_VISIBLE);
  const overflowCount = allUsers.length - MAX_VISIBLE;

  return (
    <div
      data-testid="avatar-stack"
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
      }}
    >
      {visibleUsers.map((user, index) => (
        <div
          key={user.userId}
          style={{
            marginLeft: index === 0 ? 0 : -OVERLAP,
            // Higher z-index for earlier avatars so left ones sit on top
            zIndex: MAX_VISIBLE - index,
            position: "relative",
          }}
        >
          <Avatar
            userId={user.userId}
            name={user.name}
            avatar={user.avatar}
            color={user.color}
            isSelf={user.isSelf}
          />
        </div>
      ))}

      {overflowCount > 0 && (
        <div
          data-testid="avatar-overflow"
          style={{
            marginLeft: -OVERLAP,
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            backgroundColor: "#e5e7eb",
            border: "2.5px solid #9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            zIndex: 0,
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
