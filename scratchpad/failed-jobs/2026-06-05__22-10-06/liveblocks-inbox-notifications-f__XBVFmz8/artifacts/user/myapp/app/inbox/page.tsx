"use client";

import {
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
} from "@liveblocks/react";
import { InboxNotification, InboxNotificationList } from "@liveblocks/react-ui";
import { useState } from "react";

export default function InboxPage() {
  const { inboxNotifications } = useInboxNotifications();
  const { count: unreadCount } = useUnreadInboxNotificationsCount();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = inboxNotifications?.filter((notification) => {
    if (filter === "unread") {
      return notification.readAt === null;
    }
    return true;
  });

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h1>Inbox</h1>
          <span
            data-testid="unread-badge"
            style={{
              background: "#4F46E5",
              color: "white",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 14,
            }}
          >
            {unreadCount}
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            data-testid="tab-all"
            data-active={filter === "all" ? "true" : undefined}
            onClick={() => setFilter("all")}
            style={{
              padding: "8px 16px",
              background: filter === "all" ? "#eee" : "transparent",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            All
          </button>
          <button
            data-testid="tab-unread"
            data-active={filter === "unread" ? "true" : undefined}
            onClick={() => setFilter("unread")}
            style={{
              padding: "8px 16px",
              background: filter === "unread" ? "#eee" : "transparent",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Unread
          </button>
          <button
            data-testid="mark-all-read"
            onClick={() => markAllAsRead()}
            style={{
              marginLeft: "auto",
              padding: "8px 16px",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Mark all as read
          </button>
        </div>
      </header>

      <div data-testid="notification-list">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          <InboxNotificationList>
            {filteredNotifications.map((notification) => (
              <InboxNotification
                key={notification.id}
                inboxNotification={notification}
                href={
                  notification.kind === "thread"
                    ? `/rooms/${notification.roomId}#${notification.threadId}`
                    : undefined
                }
              />
            ))}
          </InboxNotificationList>
        ) : (
          <div data-testid="empty-state" style={{ textAlign: "center", padding: 48, color: "#666" }}>
            No notifications
          </div>
        )}
      </div>
    </main>
  );
}
