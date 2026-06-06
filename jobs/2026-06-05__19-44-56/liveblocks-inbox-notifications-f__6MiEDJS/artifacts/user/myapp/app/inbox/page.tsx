"use client";

import { useState } from "react";
import {
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
} from "@liveblocks/react";
import { InboxNotification, InboxNotificationList } from "@liveblocks/react-ui";

export default function InboxPage() {
  const { inboxNotifications, isLoading } = useInboxNotifications();
  const { count } = useUnreadInboxNotificationsCount();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const notifications = inboxNotifications || [];
  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.readAt === null);

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1>Inbox</h1>
          {count !== undefined && (
            <span
              data-testid="unread-badge"
              style={{
                background: "#e53e3e",
                color: "white",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              {count}
            </span>
          )}
        </div>
        <button
          data-testid="mark-all-read"
          onClick={() => markAllAsRead()}
          style={{
            padding: "8px 16px",
            background: "#edf2f7",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Mark all as read
        </button>
      </header>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button
          data-testid="tab-all"
          data-active={activeTab === "all" ? "true" : undefined}
          onClick={() => setActiveTab("all")}
          style={{
            padding: "8px 16px",
            background: activeTab === "all" ? "#e2e8f0" : "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: activeTab === "all" ? "bold" : "normal",
          }}
        >
          All
        </button>
        <button
          data-testid="tab-unread"
          data-active={activeTab === "unread" ? "true" : undefined}
          onClick={() => setActiveTab("unread")}
          style={{
            padding: "8px 16px",
            background: activeTab === "unread" ? "#e2e8f0" : "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: activeTab === "unread" ? "bold" : "normal",
          }}
        >
          Unread
        </button>
      </div>

      <div data-testid="notification-list">
        {isLoading ? (
          <div>Loading...</div>
        ) : filteredNotifications.length === 0 ? (
          <div data-testid="empty-state" style={{ padding: 24, textAlign: "center", color: "#718096" }}>
            No notifications
          </div>
        ) : (
          <InboxNotificationList>
            {filteredNotifications.map((notification) => {
              const href =
                notification.kind === "thread"
                  ? `/rooms/${notification.roomId}#${notification.threadId}`
                  : undefined;
              return (
                <InboxNotification
                  key={notification.id}
                  inboxNotification={notification}
                  href={href}
                />
              );
            })}
          </InboxNotificationList>
        )}
      </div>
    </main>
  );
}
