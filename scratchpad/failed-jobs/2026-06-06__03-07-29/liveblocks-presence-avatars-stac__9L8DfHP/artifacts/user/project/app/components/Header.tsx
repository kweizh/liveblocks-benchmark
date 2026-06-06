"use client";

import { useState } from "react";
import { useSelf, useOthers } from "@liveblocks/react/suspense";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AvatarItem({
  userId,
  name,
  avatar,
  color,
  isSelf,
  style,
}: {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  isSelf: boolean;
  style?: React.CSSProperties;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      data-testid="avatar-item"
      data-user-id={userId}
      data-self={isSelf ? "true" : undefined}
      className="avatar-item"
      style={{
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        overflow: "visible",
        background: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        cursor: "default",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {avatar && !imgError ? (
          <img
            src={avatar}
            alt={name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      <span
        data-testid="online-dot"
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid #fff",
        }}
      />
      <span
        data-testid="avatar-tooltip"
        className="avatar-tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1f2937",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          whiteSpace: "nowrap",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 0.15s",
          zIndex: 10,
        }}
      >
        {name}
        {isSelf ? " (You)" : ""}
      </span>
    </div>
  );
}

export function Header() {
  const self = useSelf();
  const others = useOthers();

  // Sort others by connectionId ascending for stable ordering
  const sortedOthers = [...others].sort(
    (a, b) => a.connectionId - b.connectionId
  );

  // Current user first, then others sorted by connectionId
  const allUsers = self
    ? [
        { id: self.id, info: self.info, isSelf: true },
        ...sortedOthers.map((u) => ({
          id: u.id,
          info: u.info,
          isSelf: false,
        })),
      ]
    : [];

  const totalUsers = allUsers.length;
  const maxVisible = 4;
  const visibleUsers = allUsers.slice(0, maxVisible);
  const overflowCount = totalUsers - maxVisible;

  return (
    <>
      <style>{`
        .avatar-item:hover .avatar-tooltip {
          opacity: 1 !important;
        }
      `}</style>
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
            alignItems: "center",
          }}
        >
          {visibleUsers.map((user, index) => (
            <AvatarItem
              key={user.id}
              userId={user.id}
              name={user.info?.name ?? ""}
              avatar={user.info?.avatar ?? ""}
              color={user.info?.color ?? "#6b7280"}
              isSelf={user.isSelf}
              style={{
                marginLeft: index === 0 ? 0 : -8,
                zIndex: visibleUsers.length - index,
              }}
            />
          ))}
          {overflowCount > 0 && (
            <div
              data-testid="avatar-overflow"
              style={{
                marginLeft: -8,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid #d1d5db",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                flexShrink: 0,
              }}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      </header>
    </>
  );
}