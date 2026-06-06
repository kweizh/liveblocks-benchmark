# Liveblocks Inbox Notifications Feed (Next.js)

## Background
You are building the in-app notifications feed for a collaborative product powered by [Liveblocks](https://liveblocks.io). Liveblocks ships a set of React hooks (`@liveblocks/react`) and pre-built UI components (`@liveblocks/react-ui`) that surface a user's project-wide inbox notifications (e.g. when they are mentioned in a comment thread). A Next.js (App Router) scaffold is already provided at `/home/user/myapp`. The scaffold has dependencies pre-installed, an auth endpoint stub at `app/api/liveblocks-auth/route.ts`, a Liveblocks provider stub at `app/Providers.tsx`, and an inbox route stub at `app/inbox/page.tsx`. Your job is to wire the inbox page up against the real Liveblocks cloud, render the notifications using the official UI components, and implement a few small product features around them.

The authenticated user for this app is `user-1` (the auth endpoint already identifies that user). The verifier will seed a fresh room + thread that `@mentions` `user-1` against Liveblocks before launching the page, so when your implementation is correct the inbox will contain at least one unread `"thread"` notification.

## Requirements
- Implement the `/inbox` page so it renders the current user's inbox notifications using `@liveblocks/react-ui`'s `<InboxNotificationList>` and `<InboxNotification>` components.
- Show a header containing:
  - The text `Inbox`.
  - An unread badge element with `data-testid="unread-badge"` whose text content is the unread notification count (e.g. `3`). The badge must be backed by `useUnreadInboxNotificationsCount()` and update reactively.
  - A button with `data-testid="mark-all-read"` labelled `Mark all as read` that calls `useMarkAllInboxNotificationsAsRead()`.
- Provide two tabs with `data-testid="tab-all"` and `data-testid="tab-unread"` (labels `All` and `Unread`). The active tab must visually filter the list:
  - `All`: every notification from `useInboxNotifications()`.
  - `Unread`: only notifications where `readAt` is `null`.
  The currently active tab must expose `data-active="true"` on its element so it can be detected.
- Wrap the notification list in a container with `data-testid="notification-list"`. When the active tab has no notifications, render an element with `data-testid="empty-state"` whose text content includes `No notifications`.
- Each `<InboxNotification>` rendered for a `"thread"` kind notification MUST navigate to `/rooms/{roomId}#{threadId}` when clicked. Use the `<InboxNotification>` component's `href` prop (it forwards to the underlying anchor).
- Read configuration from environment variables. The public key must be exposed to the browser through `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`. The server-only secret key is `LIVEBLOCKS_SECRET_KEY` and must NOT leak to the client.
- Do NOT mock Liveblocks. The page must talk to the real Liveblocks cloud through `@liveblocks/react` + the auth endpoint.

## Implementation Hints
- The existing `LiveblocksProvider` stub needs to point at your auth endpoint (`/api/liveblocks-auth`) so notifications can load. The hooks `useInboxNotifications`, `useUnreadInboxNotificationsCount`, and `useMarkAllInboxNotificationsAsRead` live in `@liveblocks/react` and only work inside a `LiveblocksProvider` (a `RoomProvider` is NOT required for inbox notifications).
- Inbox notifications are project-wide, so you do not need to pick a specific room for the provider. Just configure the provider with the auth endpoint.
- `inboxNotification.kind === "thread"` notifications expose `roomId` and `threadId`. Use those to build the `href`.
- The `<InboxNotification>` component already renders the room/thread title and timestamp for `"thread"` kinds; you do not need to render the body yourself.
- Don't forget the CSS reset for the Liveblocks UI library: import `@liveblocks/react-ui/styles.css` somewhere in the app (the root layout is the natural place).
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable if you need it for any local naming, but you should NOT need to create rooms yourself; the verifier seeds the data.

## Acceptance Criteria
- Project path: /home/user/myapp
- Start command: npm run dev
- Port: 3000
- Routes / pages:
  - `/inbox`: Renders the authenticated user's inbox notifications via Liveblocks.
    - Header contains the text `Inbox`.
    - Element with `data-testid="unread-badge"` contains the current unread count as an integer string.
    - Button with `data-testid="mark-all-read"` labelled `Mark all as read` marks every inbox notification as read when clicked.
    - Tabs with `data-testid="tab-all"` and `data-testid="tab-unread"`. The active tab exposes `data-active="true"`.
    - Container with `data-testid="notification-list"` containing one element per visible notification. When empty, contains an element with `data-testid="empty-state"` whose text includes `No notifications`.
    - Each rendered notification is an anchor whose `href` matches `/rooms/<roomId>#<threadId>` for `"thread"` kind notifications.
- The page must use the real Liveblocks cloud via `LIVEBLOCKS_SECRET_KEY` (server) and `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` (client). Do not mock Liveblocks.
- The auth endpoint at `/api/liveblocks-auth` must identify the request user as `user-1` (already provided; keep it intact).

