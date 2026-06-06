FROM ubuntu:24.04

# ---------------------------------------------------------------------------
# Base system + python + node + browser libs for Playwright
# ---------------------------------------------------------------------------
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 \
        libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 \
        libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 \
        libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 \
        libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 \
        libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages \
        pytest-json-ctrf \
        pytest-xprocess \
        requests \
        playwright && \
    python3 -m playwright install chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# ---------------------------------------------------------------------------
# Next.js + Liveblocks skeleton at /home/user/myproject
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth && \
    mkdir -p /home/user/myproject/app/Room && \
    mkdir -p /home/user/myproject/components

WORKDIR /home/user/myproject

# package.json — declares Next.js and Liveblocks dependencies.
RUN cat >/home/user/myproject/package.json <<'EOF'
{
  "name": "liveblocks-collaborative-todo-list",
  "version": "0.1.0",
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
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.12.7",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.5"
  }
}
EOF

RUN cat >/home/user/myproject/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
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
EOF

RUN cat >/home/user/myproject/next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "",
  },
};
module.exports = nextConfig;
EOF

RUN cat >/home/user/myproject/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

# liveblocks.config.ts — Storage type uses LiveList<LiveObject<...>>.
RUN cat >/home/user/myproject/liveblocks.config.ts <<'EOF'
import type { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: Record<string, never>;
    Storage: {
      todos: LiveList<LiveObject<{ id: string; text: string; done: boolean }>>;
    };
    UserMeta: {
      id: string;
      info: { name: string };
    };
    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
EOF

# Liveblocks auth route — uses LIVEBLOCKS_SECRET_KEY.
RUN cat >/home/user/myproject/app/api/liveblocks-auth/route.ts <<'EOF'
import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "LIVEBLOCKS_SECRET_KEY is not configured." },
      { status: 500 }
    );
  }
  const liveblocks = new Liveblocks({ secret });

  const userId = `user-${Math.floor(Math.random() * 1_000_000)}`;
  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: userId },
  });
  session.allow(`harbor-todo-*`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
EOF

# Root layout — wraps the app with LiveblocksProvider (using the auth endpoint).
RUN cat >/home/user/myproject/app/layout.tsx <<'EOF'
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Liveblocks Collaborative Todo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

RUN cat >/home/user/myproject/app/globals.css <<'EOF'
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
ul { list-style: none; padding: 0; margin: 16px 0; }
li { display: flex; gap: 8px; align-items: center; padding: 4px 0; }
EOF

# Client-side providers (LiveblocksProvider + RoomProvider + initial Storage).
RUN cat >/home/user/myproject/app/providers.tsx <<'EOF'
"use client";

import { LiveList } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { ReactNode } from "react";

function roomId(): string {
  const runId =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ZEALT_RUN_ID) || "local";
  return `harbor-todo-${runId}`;
}

export function Providers({ children }: { children: ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const providerProps = publicKey
    ? { publicApiKey: publicKey }
    : { authEndpoint: "/api/liveblocks-auth" as const };

  return (
    <LiveblocksProvider {...(providerProps as any)}>
      <RoomProvider
        id={roomId()}
        initialStorage={{
          todos: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

# Initial page.tsx — skeleton UI only. Inputs are present, but CRUD logic is NOT implemented.
RUN cat >/home/user/myproject/app/page.tsx <<'EOF'
"use client";

import { useState } from "react";

export default function Page() {
  const [text, setText] = useState("");

  return (
    <main>
      <h1>Collaborative Todo List</h1>

      <div>
        <input
          data-testid="new-todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo"
        />
        <button data-testid="add-todo-button" type="button">
          Add
        </button>
        <button data-testid="clear-completed-button" type="button">
          Clear completed
        </button>
      </div>

      <ul data-testid="todo-list">
        {/* TODO(executor): render rows here using a useStorage selector,
            with data-testid="todo-item" and attribute data-todo-text. */}
      </ul>
    </main>
  );
}
EOF

# README + .env.example reference both env keys.
RUN cat >/home/user/myproject/README.md <<'EOF'
# Collaborative Todo List (Liveblocks)

This skeleton is wired up with Liveblocks (LiveblocksProvider, RoomProvider,
liveblocks.config.ts Storage type, and an /api/liveblocks-auth route handler).

Required environment variables:

- `LIVEBLOCKS_SECRET_KEY` — server-side secret for the /api/liveblocks-auth route.
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` — exposed to the browser for direct cloud connection.

The room id is `harbor-todo-${ZEALT_RUN_ID}`; the value of `ZEALT_RUN_ID` is exposed
to the browser via `NEXT_PUBLIC_ZEALT_RUN_ID`.

Run `npm run dev` to start the app on port 3000.
EOF

RUN cat >/home/user/myproject/.env.example <<'EOF'
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
ZEALT_RUN_ID=
NEXT_PUBLIC_ZEALT_RUN_ID=
EOF

# Install dependencies — pre-installed so the executor doesn't need network.
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error

WORKDIR /home/user

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js + Liveblocks skeleton for the collaborative todo list task, with Playwright browser verification dependencies installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v20 for the Next.js task environment
#   - Playwright (pip) + chromium browser binaries for two-browser realtime verification
#   - /home/user/myproject: Next.js + Liveblocks skeleton with the Storage type defined, the
#     LiveblocksProvider + RoomProvider configured, the /api/liveblocks-auth route wired up
#     to LIVEBLOCKS_SECRET_KEY, and the page.tsx UI scaffolding present. The todo CRUD
#     mutations (add / toggle / delete / clear-completed) are intentionally NOT implemented.
