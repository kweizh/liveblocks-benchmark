FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        curl wget ca-certificates git bash ripgrep \
        python3 python3-pip python3-pytest \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 \
        libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 \
        libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 \
        libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 \
        libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 \
        libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 \
        libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages \
        pytest-json-ctrf requests pytest-xprocess playwright && \
    playwright install chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# --- Scaffold the Next.js + Liveblocks starter project ------------------
RUN mkdir -p /home/user/project/app/active-users && \
    mkdir -p /home/user/project/app/api/liveblocks-auth

WORKDIR /home/user/project

RUN cat >/home/user/project/package.json <<'EOF'
{
  "name": "liveblocks-active-users-list",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "@liveblocks/client": "2.20.0",
    "@liveblocks/node": "2.20.0",
    "@liveblocks/react": "2.20.0",
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
  }
}
EOF

RUN cat >/home/user/project/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

RUN cat >/home/user/project/next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};
export default nextConfig;
EOF

RUN cat >/home/user/project/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

RUN cat >/home/user/project/liveblocks.config.ts <<'EOF'
/**
 * Liveblocks v2 type declarations for the active-users-list task.
 *
 * Each connected user sets a Presence `name` field shaped as
 * `User-<connectionId>`. UserMeta is unused; the auth endpoint mints
 * anonymous sessions.
 */
export type Presence = {
  name: string | null;
};

export type Storage = Record<string, never>;

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
  }
}

export {};
EOF

RUN cat >/home/user/project/app/layout.tsx <<'EOF'
import React from "react";

export const metadata = {
  title: "Liveblocks Active Users List",
  description: "Realtime active-users list backed by Liveblocks v2 presence"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

RUN cat >/home/user/project/app/page.tsx <<'EOF'
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Active Users List</h1>
      <p>
        Open <Link href="/active-users">/active-users</Link> in multiple
        browser windows to collaborate.
      </p>
    </main>
  );
}
EOF

RUN cat >/home/user/project/app/api/liveblocks-auth/route.ts <<'EOF'
import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

export async function POST(request: Request) {
  if (!secret) {
    return NextResponse.json(
      { error: "Missing LIVEBLOCKS_SECRET_KEY" },
      { status: 500 }
    );
  }

  let body: { room?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const room = typeof body?.room === "string" ? body.room : "default-room";

  const liveblocks = new Liveblocks({ secret });
  const session = liveblocks.prepareSession(
    `user-${Math.random().toString(36).slice(2, 10)}`,
    { userInfo: { name: "anonymous" } }
  );
  session.allow(room, session.FULL_ACCESS);

  const { status, body: tokenBody } = await session.authorize();
  return new NextResponse(tokenBody, {
    status,
    headers: { "content-type": "application/json" }
  });
}
EOF

# Active-users skeleton: RoomProvider is set up, but the presence-driven UI
# is intentionally left TODO so the executor can implement it.
RUN cat >/home/user/project/app/active-users/Room.tsx <<'EOF'
"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ name: null }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

RUN cat >/home/user/project/app/active-users/page.tsx <<'EOF'
"use client";

import { Room } from "./Room";

// TODO: implement the active-users list and count here.
//
// Requirements (see instruction.md for the full spec):
//   - Each connected client must publish a Presence `name` equal to
//     `User-<connectionId>` (use useSelf()?.connectionId + useUpdateMyPresence).
//   - Render <ul id="active-users"> with one <li data-connection-id="<id>">
//     per connected user (current user included). The visible text content
//     of each <li> must be that user's presence `name`.
//   - Render <span id="active-users-count"> with the integer count of
//     connected users, equal to useOthers().length + 1.
//   - The room id must come from process.env.NEXT_PUBLIC_ZEALT_RUN_ID
//     (literal pattern: `active-users-${NEXT_PUBLIC_ZEALT_RUN_ID}`).

function ActiveUsers() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Active users</h1>
      <p>TODO: build the active-users list and count per the task instructions.</p>
    </main>
  );
}

export default function ActiveUsersPage() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
  const roomId = `active-users-${runId}`;

  return (
    <Room roomId={roomId}>
      <ActiveUsers />
    </Room>
  );
}
EOF

# Install dependencies ahead of time so the executor (and tests) do not pay
# the install cost at run time. Use --no-audit/--no-fund to keep the build
# log small. `npm install` is used (not `ci`) because there is no lockfile
# committed inside the image.
RUN cd /home/user/project && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks v2 starter for the active-users-list task. Pre-installs Node 20, Playwright Chromium, and the Liveblocks SDK skeleton at /home/user/project."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip
#     python3-pytest bash ripgrep + Playwright system libs + ffmpeg
#   - Node.js v20 (LTS) via NodeSource
#   - pip3 packages: pytest-json-ctrf requests pytest-xprocess playwright
#   - Playwright Chromium pre-installed for browser verification
#   - /home/user/project: Next.js 14 + Liveblocks v2 starter with the
#     active-users route at app/active-users/page.tsx (presence wiring TODO),
#     `/api/liveblocks-auth` already wired with @liveblocks/node, and
#     liveblocks.config.ts declaring Presence.name.
#   - node_modules pre-installed.
