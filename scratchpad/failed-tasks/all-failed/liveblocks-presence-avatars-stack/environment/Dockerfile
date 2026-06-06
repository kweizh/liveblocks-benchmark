FROM ubuntu:24.04

# ---------------------------------------------------------------------------
# 1) Base packages + Node.js 20 + Python deps + Playwright system deps
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
        pytest-json-ctrf pytest-xprocess requests playwright && \
    python3 -m playwright install --with-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# ---------------------------------------------------------------------------
# 2) Scaffold the Next.js project at /home/user/project
# ---------------------------------------------------------------------------
WORKDIR /home/user/project

RUN cat >package.json <<'EOF'
{
  "name": "liveblocks-presence-avatars-stack",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "@liveblocks/client": "^2.16.0",
    "@liveblocks/node": "^2.16.0",
    "@liveblocks/react": "^2.16.0",
    "next": "14.2.18",
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
EOF

RUN cat >tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
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
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

RUN cat >next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};
export default nextConfig;
EOF

RUN cat >next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

RUN cat >liveblocks.config.ts <<'EOF'
declare global {
  interface Liveblocks {
    Presence: {};
    Storage: {};
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };
    RoomEvent: {};
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
EOF

RUN mkdir -p app/api/liveblocks-auth app/components app/lib

RUN cat >app/lib/mock-users.ts <<'EOF'
export type MockUser = {
  userId: string;
  name: string;
  avatar: string;
  color: string;
};

// A fixed roster of 6 mock users used by the presence-avatars task.
// The executor MUST NOT rename or reorder this list; the verifier
// asserts on the names of mock user 0 and mock user 1.
export const MOCK_USERS: MockUser[] = [
  {
    userId: "user-0",
    name: "Charlie Cloud",
    avatar: "https://liveblocks.io/avatars/avatar-1.png",
    color: "#E11D48",
  },
  {
    userId: "user-1",
    name: "Dakota Drift",
    avatar: "https://liveblocks.io/avatars/avatar-2.png",
    color: "#2563EB",
  },
  {
    userId: "user-2",
    name: "Echo Everest",
    avatar: "https://liveblocks.io/avatars/avatar-3.png",
    color: "#16A34A",
  },
  {
    userId: "user-3",
    name: "Fox Falcon",
    avatar: "https://liveblocks.io/avatars/avatar-4.png",
    color: "#D97706",
  },
  {
    userId: "user-4",
    name: "Gale Garnet",
    avatar: "https://liveblocks.io/avatars/avatar-5.png",
    color: "#7C3AED",
  },
  {
    userId: "user-5",
    name: "Harper Halo",
    avatar: "https://liveblocks.io/avatars/avatar-6.png",
    color: "#0EA5E9",
  },
];

export function getMockUserByIndex(index: number): MockUser {
  const i = ((index % MOCK_USERS.length) + MOCK_USERS.length) % MOCK_USERS.length;
  return MOCK_USERS[i];
}

export function pickMockUserFromRequest(req: Request): MockUser {
  // Prefer ?user=<n> in the request URL, falling back to the mockUser cookie.
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("user");
    if (q !== null) return getMockUserByIndex(parseInt(q, 10) || 0);
  } catch {
    // ignore
  }
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)mockUser=([^;]+)/);
  if (match) {
    const n = parseInt(decodeURIComponent(match[1]), 10);
    if (!Number.isNaN(n)) return getMockUserByIndex(n);
  }
  return getMockUserByIndex(0);
}
EOF

RUN cat >app/layout.tsx <<'EOF'
import type { ReactNode } from "react";

export const metadata = { title: "Liveblocks Presence Avatars", description: "" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
EOF

RUN cat >app/Room.tsx <<'EOF'
"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      publicApiKey={PUBLIC_KEY || undefined}
    >
      <RoomProvider id={roomId} initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Connecting…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

RUN cat >app/page.tsx <<'EOF'
import { Room } from "./Room";
import { Header } from "./components/Header";

function getRoomId(): string {
  const runId =
    process.env.NEXT_PUBLIC_ZEALT_RUN_ID ?? process.env.ZEALT_RUN_ID ?? "dev";
  return `presence-avatars-${runId}`;
}

export default function Page() {
  const roomId = getRoomId();
  return (
    <Room roomId={roomId}>
      <main>
        <Header />
        <section style={{ padding: 24 }}>
          <h1>Presence Avatars Demo</h1>
          <p>Open this page in multiple tabs to see the avatar stack update.</p>
        </section>
      </main>
    </Room>
  );
}
EOF

# Header skeleton: contains the <header> element but does NOT yet render any presence UI.
# Driving the per-connection presence UI is the executor's task — see instruction.md.
RUN cat >app/components/Header.tsx <<'EOF'
"use client";

// Initial scaffold of the header. See instruction.md for the full spec
// of the presence-driven UI the executor must build inside this header.
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
      <div style={{ fontWeight: 600 }}>Presence Avatars</div>
      <div data-testid="header-right" />
    </header>
  );
}
EOF

# Auth route skeleton: authenticates via identifyUser, but does NOT yet attach the
# extra session metadata that the avatar stack needs. See instruction.md.
RUN cat >app/api/liveblocks-auth/route.ts <<'EOF'
import { Liveblocks } from "@liveblocks/node";
import { pickMockUserFromRequest } from "../../lib/mock-users";

const SECRET = process.env.LIVEBLOCKS_SECRET_KEY ?? "";

export async function POST(request: Request) {
  if (!SECRET) {
    return new Response(
      JSON.stringify({ error: "LIVEBLOCKS_SECRET_KEY is not set" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const liveblocks = new Liveblocks({ secret: SECRET });
  const user = pickMockUserFromRequest(request);

  const { status, body } = await liveblocks.identifyUser({
    userId: user.userId,
  });

  return new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}
EOF

# ---------------------------------------------------------------------------
# 3) Pre-install Node dependencies so the scaffold matches test_initial_state
# ---------------------------------------------------------------------------
RUN npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Liveblocks presence-avatars-stack task: Next.js 14 + Node 20 + Liveblocks deps + Playwright Chromium; scaffolded Header skeleton awaiting avatar-stack implementation."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep + Playwright system libs
#   - pip3 packages: pytest-json-ctrf pytest-xprocess requests playwright (+ Playwright Chromium browser)
#   - Node.js v20 for running the Next.js app
#   - /home/user/project: pre-scaffolded Next.js app with Liveblocks wiring:
#       * liveblocks.config.ts with UserMeta info { name, avatar, color }
#       * app/page.tsx + app/Room.tsx with LiveblocksProvider + RoomProvider
#       * app/components/Header.tsx (skeleton; no useOthers, no avatar-stack yet)
#       * app/api/liveblocks-auth/route.ts (identifyUser only; no userInfo yet)
#       * app/lib/mock-users.ts (6 fixed mock users keyed by mockUser cookie / ?user= param)
#   - node_modules pre-installed via `npm install` so the project boots offline
