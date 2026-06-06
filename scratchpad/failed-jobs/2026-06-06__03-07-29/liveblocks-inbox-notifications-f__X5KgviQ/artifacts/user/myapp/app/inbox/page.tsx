"use client";

import { useState } from "react";
import {
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
  useMarkAllInboxNotificationsAsRead,
} from "@liveblocks/react";
import { InboxNotification } from "@liveblocks/react-ui";
import type { InboxNotificationData, InboxNotificationThreadData } from "@liveblocks/core";

type Tab = "all" | "unread";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { inboxNotifications, isLoading } = useInboxNotifications();
  const { count: unreadCount } = useUnreadInboxNotificationsCount();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();

  const visibleNotifications =
    activeTab === "unread"
      ? (inboxNotifications ?? []).filter(
          (n: InboxNotificationData) => n.readAt === null
        )
      : inboxNotifications ?? [];

  const isEmpty = visibleNotifications.length === 0;

  function getHref(notification: InboxNotificationData): string | undefined {
    if (notification.kind === "thread") {
      const threadNotification = notification as InboxNotificationThreadData;
      return `/rooms/${threadNotification.roomId}#${threadNotification.threadId}`;
    }
    return undefined;
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Inbox</h1>
        <span data-testid="unread-badge">{unreadCount ?? 0}</span>
        <button
          data-testid="mark-all-read"
          onClick={() => markAllAsRead()}
        >
          Mark all as read
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          data-testid="tab-all"
          data-active={activeTab === "all" ? "true" : undefined}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          data-testid="tab-unread"
          data-active={activeTab === "unread" ? "true" : undefined}
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
      </div>

      <div data-testid="notification-list">
        {isLoading ? (
          <p>Loading...</p>
        ) : isEmpty ? (
          <p data-testid="empty-state">No notifications</p>
        ) : (
          visibleNotifications.map((notification: InboxNotificationData) => (
            <InboxNotification
              key={notification.id}
              inboxNotification={notification}
              href={getHref(notification)}
            />
          ))
        )}
      </div>
    </main>
  );
}