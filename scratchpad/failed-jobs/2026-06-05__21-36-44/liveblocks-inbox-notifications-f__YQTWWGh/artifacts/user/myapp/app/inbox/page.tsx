"use client";

import { useState } from "react";
import {
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
} from "@liveblocks/react";
import {
  InboxNotification,
  InboxNotificationList,
} from "@liveblocks/react-ui";

type Tab = "all" | "unread";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { inboxNotifications, isLoading } = useInboxNotifications();
  const { count: unreadCount } = useUnreadInboxNotificationsCount();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();

  const visibleNotifications =
    inboxNotifications == null
      ? []
      : activeTab === "unread"
      ? inboxNotifications.filter((n) => n.readAt === null)
      : inboxNotifications;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Inbox</h1>
        <span
          data-testid="unread-badge"
          style={{
            background: "#4F46E5",
            color: "#fff",
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 14,
            fontWeight: 600,
            minWidth: 24,
            textAlign: "center",
          }}
        >
          {unreadCount ?? 0}
        </span>
        <button
          data-testid="mark-all-read"
          onClick={() => markAllAsRead()}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button
          data-testid="tab-all"
          data-active={activeTab === "all" ? "true" : "false"}
          onClick={() => setActiveTab("all")}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "all" ? 700 : 400,
            background: activeTab === "all" ? "#4F46E5" : "#f3f4f6",
            color: activeTab === "all" ? "#fff" : "#374151",
            fontSize: 14,
          }}
        >
          All
        </button>
        <button
          data-testid="tab-unread"
          data-active={activeTab === "unread" ? "true" : "false"}
          onClick={() => setActiveTab("unread")}
          style={{
            padding: "6px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "unread" ? 700 : 400,
            background: activeTab === "unread" ? "#4F46E5" : "#f3f4f6",
            color: activeTab === "unread" ? "#fff" : "#374151",
            fontSize: 14,
          }}
        >
          Unread
        </button>
      </div>

      {/* Notification list */}
      <div data-testid="notification-list">
        {isLoading ? (
          <p style={{ color: "#6b7280" }}>Loading notifications…</p>
        ) : visibleNotifications.length === 0 ? (
          <div data-testid="empty-state" style={{ color: "#6b7280", padding: "16px 0" }}>
            No notifications
          </div>
        ) : (
          <InboxNotificationList>
            {visibleNotifications.map((notification) => {
              if (notification.kind === "thread") {
                const href = `/rooms/${notification.roomId}#${notification.threadId}`;
                return (
                  <InboxNotification
                    key={notification.id}
                    inboxNotification={notification}
                    href={href}
                  />
                );
              }
              return (
                <InboxNotification
                  key={notification.id}
                  inboxNotification={notification}
                />
              );
            })}
          </InboxNotificationList>
        )}
      </div>
    </main>
  );
}
