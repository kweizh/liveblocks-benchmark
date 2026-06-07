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
RUN mkdir -p /home/user/project/app/api/liveblocks-auth

WORKDIR /home/user/project

RUN cat >/home/user/project/package.json <<'EOF'
{
  "name": "liveblocks-shared-stopwatch",
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
import type { LiveObject } from "@liveblocks/client";

/**
 * Storage layout for the shared stopwatch.
 *
 *   root.stopwatch: LiveObject<{
 *     running: boolean;
 *     startedAt: number | null;   // ms epoch when the stopwatch was started
 *     accumulatedMs: number;      // accumulated runtime across stop/start
 *   }>
 *
 * The executor must use this type together with `useMutation` / `useStorage`
 * from `@liveblocks/react` to read and write Storage.
 */
export type StopwatchState = {
  running: boolean;
  startedAt: number | null;
  accumulatedMs: number;
};

export type Storage = {
  stopwatch: LiveObject<StopwatchState>;
};

export type Presence = Record<string, never>;

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

declare global {
  interface Liveblocks {
    Storage: Storage;
    Presence: Presence;
    UserMeta: UserMeta;
  }
}
EOF

RUN cat >/home/user/project/app/layout.tsx <<'EOF'
import React from "react";

export const metadata = {
  title: "Liveblocks Shared Stopwatch",
  description: "Collaborative stopwatch built on Liveblocks Storage"
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

# Home page skeleton: provider wiring is delegated to a helper so the
# main page file stays free of Storage primitives.
RUN cat >/home/user/project/app/Room.tsx <<'EOF'
"use client";

import { LiveObject } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          stopwatch: new LiveObject({
            running: false,
            startedAt: null,
            accumulatedMs: 0
          })
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

RUN cat >/home/user/project/app/page.tsx <<'EOF'
"use client";

import { Room } from "./Room";

// TODO: implement the shared stopwatch UI here.
//
// See instruction.md for the full specification of the UI, Storage layout,
// mutation behavior, and required DOM contract. The provider wiring lives in
// ./Room.tsx and is already in place — render your stopwatch as children of
// <Room>.

function Stopwatch() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Shared Stopwatch</h1>
      <p>TODO: build the stopwatch UI per the task instructions.</p>
    </main>
  );
}

export default function HomePage() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
  const roomId = `stopwatch-${runId}`;

  return (
    <Room roomId={roomId}>
      <Stopwatch />
    </Room>
  );
}
EOF

# Install dependencies ahead of time so the executor (and tests) do not pay
# the install cost at run time.
RUN cd /home/user/project && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks starter for the liveblocks-shared-stopwatch task. Pre-installs Node 20, Playwright Chromium, and the Liveblocks SDK skeleton at /home/user/project."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip
#     python3-pytest bash ripgrep + Playwright system libs + ffmpeg
#   - Node.js v20 (LTS) via NodeSource
#   - pip3 packages: pytest-json-ctrf requests pytest-xprocess playwright
#   - Playwright Chromium pre-installed for browser verification
#   - /home/user/project: Next.js 14 + Liveblocks starter with the stopwatch
#     skeleton at app/page.tsx (Storage mutations TODO), `/api/liveblocks-auth`
#     already wired with @liveblocks/node, and liveblocks.config.ts declaring
#     Storage.stopwatch as LiveObject<{running, startedAt, accumulatedMs}>.
#   - node_modules pre-installed.
