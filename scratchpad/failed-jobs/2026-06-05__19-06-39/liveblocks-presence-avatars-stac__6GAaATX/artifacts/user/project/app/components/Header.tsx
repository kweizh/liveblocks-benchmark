"use client";

import { useSelf, useOthers, ClientSideSuspense } from "@liveblocks/react/suspense";
import { useState } from "react";

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AvatarItem({ user, isSelf }: { user: any; isSelf: boolean }) {
  const [imageError, setImageError] = useState(false);
  const info = user?.info;
  const name = info?.name || "Unknown";
  const avatarUrl = info?.avatar;
  const color = info?.color || "#e5e7eb";
  const initials = getInitials(name);

  const displayName = isSelf ? `${name} (You)` : name;

  return (
    <div
      data-testid="avatar-item"
      data-user-id={user?.id}
      {...(isSelf ? { "data-self": "true" } : {})}
      className="avatar-wrapper"
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
        marginLeft: -8, // overlapping
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

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
          background: "#22c55e",
          border: "2px solid #fff",
        }}
      />

      {/* Tooltip */}
      <div data-testid="avatar-tooltip" className="avatar-tooltip">
        {displayName}
      </div>
    </div>
  );
}

function AvatarStackInner() {
  const self = useSelf();
  const others = useOthers();

  const sortedOthers = [...(others || [])].sort((a, b) => a.connectionId - b.connectionId);
  const allUsers = self ? [self, ...sortedOthers] : sortedOthers;
  const visibleUsers = allUsers.slice(0, 4);
  const overflowCount = allUsers.length > 4 ? allUsers.length - 4 : 0;

  return (
    <div
      data-testid="avatar-stack"
      style={{
        display: "flex",
        alignItems: "center",
        paddingLeft: 8, // to offset the negative margin of the first avatar
      }}
    >
      {visibleUsers.map((user) => {
        const isSelf = user.id === self?.id && user.connectionId === self?.connectionId;
        return (
          <AvatarItem
            key={`${user.id}-${user.connectionId}`}
            user={user}
            isSelf={isSelf}
          />
        );
      })}

      {overflowCount > 0 && (
        <div
          data-testid="avatar-overflow"
          style={{
            position: "relative",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid #e5e7eb",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
            color: "#4b5563",
            marginLeft: -8,
            userSelect: "none",
          }}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

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
      <style>{`
        .avatar-wrapper {
          position: relative;
        }
        .avatar-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.9);
          background: #1f2937;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.15s ease-in-out;
          z-index: 50;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .avatar-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: #1f2937 transparent transparent transparent;
        }
        .avatar-wrapper:hover .avatar-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
      `}</style>
      <div style={{ fontWeight: 600 }}>Presence Avatars</div>
      <ClientSideSuspense fallback={<div data-testid="avatar-stack" />}>
        {() => <AvatarStackInner />}
      </ClientSideSuspense>
      <div data-testid="header-right" />
    </header>
  );
}
