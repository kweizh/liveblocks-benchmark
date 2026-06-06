FROM ubuntu:24.04

# Base system + browser verification deps + Node.js v20 (per task requirement).
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm i -g agent-browser && \
    agent-browser install && \
    pip3 install --break-system-packages pytest-json-ctrf pochi-verifier requests pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Scaffold the Next.js project: LiveblocksProvider + RoomProvider + <Composer />
# already render, /api/users serves the 5-user directory, and /api/liveblocks-auth
# already calls Liveblocks.identifyUser for `user-alice`. The executor is expected
# to add `resolveMentionSuggestions` and `resolveUsers` on `<LiveblocksProvider />`.
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth && \
    mkdir -p /home/user/myproject/app/api/users

RUN cat > /home/user/myproject/package.json <<'PKGEOF'
{
  "name": "liveblocks-comments-mentions-resolver",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@liveblocks/client": "^2.20.0",
    "@liveblocks/node": "^2.20.0",
    "@liveblocks/react": "^2.20.0",
    "@liveblocks/react-ui": "^2.20.0",
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.5.3"
  }
}
PKGEOF

RUN cat > /home/user/myproject/tsconfig.json <<'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
TSCONFIG

RUN cat > /home/user/myproject/next.config.mjs <<'NEXTCFG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;
NEXTCFG

RUN cat > /home/user/myproject/next-env.d.ts <<'NEXTENV'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
NEXTENV

RUN cat > /home/user/myproject/liveblocks.config.ts <<'LBCFG'
// Liveblocks global type augmentation.
declare global {
  interface Liveblocks {
    UserMeta: {
      id: string;
      info?: {
        name?: string;
        avatar?: string;
      };
    };
    ThreadMetadata: {};
  }
}

export {};
LBCFG

RUN cat > /home/user/myproject/.env.local <<'ENVLOCAL'
# Liveblocks credentials are injected by the Harbor environment.
# LIVEBLOCKS_SECRET_KEY=sk_xxx
# NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_xxx
ENVLOCAL

RUN cat > /home/user/myproject/app/layout.tsx <<'LAYOUT'
import type { ReactNode } from "react";
import "@liveblocks/react-ui/styles.css";

export const metadata = {
  title: "Liveblocks Comments Mentions Resolver",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
LAYOUT

RUN cat > /home/user/myproject/app/page.tsx <<'PAGE'
import { Room } from "./Room";

export default function Page() {
  const runId = process.env.ZEALT_RUN_ID || "default";
  const roomId = `comments-mentions-${runId}`;
  return <Room roomId={roomId} />;
}
PAGE

RUN cat > /home/user/myproject/app/Room.tsx <<'ROOM'
"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { CommentsPanel } from "./CommentsPanel";

// NOTE (executor): The LiveblocksProvider below is intentionally minimal.
// The Composer will not yet show @mention suggestions, and submitted comments
// will render raw user IDs (e.g. `user-alice`) instead of display names.
// Add the missing resolver callbacks here, backed by /api/users.
export function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading comments…</div>}>
          <CommentsPanel />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
ROOM

RUN cat > /home/user/myproject/app/CommentsPanel.tsx <<'PANEL'
"use client";

import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react/suspense";

export function CommentsPanel() {
  const { threads } = useThreads();
  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Comments</h1>
      <Composer />
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {threads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}
PANEL

RUN cat > /home/user/myproject/app/users.ts <<'USERS'
// Hardcoded in-memory user directory.
export type DirectoryUser = {
  id: string;
  name: string;
  avatar: string;
};

export const USERS: DirectoryUser[] = [
  { id: "user-alice",   name: "Alice",   avatar: "https://liveblocks.io/avatars/avatar-1.png" },
  { id: "user-bob",     name: "Bob",     avatar: "https://liveblocks.io/avatars/avatar-2.png" },
  { id: "user-charlie", name: "Charlie", avatar: "https://liveblocks.io/avatars/avatar-3.png" },
  { id: "user-dave",    name: "Dave",    avatar: "https://liveblocks.io/avatars/avatar-4.png" },
  { id: "user-eve",     name: "Eve",     avatar: "https://liveblocks.io/avatars/avatar-5.png" },
];
USERS

RUN cat > /home/user/myproject/app/api/users/route.ts <<'USERSAPI'
import { NextResponse } from "next/server";
import { USERS } from "../../users";

export async function GET() {
  return NextResponse.json(USERS);
}
USERSAPI

RUN cat > /home/user/myproject/app/api/liveblocks-auth/route.ts <<'AUTH'
import { Liveblocks } from "@liveblocks/node";
import { USERS } from "../../users";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

// The currently authenticated user is always `user-alice` in this scaffold.
// This is what makes `identifyUser` correct end-to-end and lets mentions
// resolve a "real" current user identity.
export async function POST(_request: Request) {
  const currentUser = USERS[0]; // user-alice
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: currentUser.id,
      groupIds: [],
    },
    {
      userInfo: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
    },
  );
  return new Response(body, { status });
}
AUTH

# Pre-install node_modules so the initial-state test sees them and so the
# dev server starts quickly. Also install Playwright Chromium so browser-based
# final-state verification can run without network access at test time.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund && \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright npx --yes playwright@1.46.0 install chromium || true

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks Comments scaffold; Composer renders, /api/users + /api/liveblocks-auth wired, mention resolvers intentionally missing."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep + browser deps
#   - Node.js v20 from NodeSource, agent-browser installed for pochi-verifier
#   - pip3: pytest-json-ctrf pochi-verifier requests pytest-xprocess
#   - /home/user/myproject: Next.js 14 scaffold with @liveblocks/{client,node,react,react-ui}
#       * <Composer /> + <Thread /> rendered on home page inside LiveblocksProvider + RoomProvider
#       * /api/users serves the hardcoded 5-user directory (alice, bob, charlie, dave, eve)
#       * /api/liveblocks-auth uses Liveblocks.identifyUser to authenticate user-alice
#       * resolveMentionSuggestions / resolveUsers intentionally NOT wired (the executor must add them)
#   - Playwright Chromium pre-installed at /ms-playwright for browser-based final-state verification
