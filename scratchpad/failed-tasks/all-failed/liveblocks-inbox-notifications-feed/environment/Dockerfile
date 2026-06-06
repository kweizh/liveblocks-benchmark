FROM ubuntu:24.04

# ---------------------------------------------------------------------------
# Base OS + browser verification deps + Node.js 20 + Python tooling
# ---------------------------------------------------------------------------
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm i -g agent-browser && \
    agent-browser install && \
    pip3 install --break-system-packages pytest-json-ctrf pochi-verifier pytest-xprocess requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# /home/user workspace
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user && chmod 0755 /home/user

# ---------------------------------------------------------------------------
# Scaffold the Next.js (App Router) starter project at /home/user/myapp
# Notes:
#   - The inbox page exists as a stub but does NOT yet wire up
#     useInboxNotifications / useUnreadInboxNotificationsCount /
#     useMarkAllInboxNotificationsAsRead / InboxNotificationList. The agent
#     must implement those.
#   - The Liveblocks auth route stub identifies the request user as user-1
#     using @liveblocks/node.
#   - All node_modules are pre-installed so the agent has no network setup
#     friction when invoking npm.
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myapp/app/api/liveblocks-auth /home/user/myapp/app/inbox /home/user/myapp/app/rooms/[roomId] /home/user/myapp/public

WORKDIR /home/user/myapp

# package.json
RUN cat >/home/user/myapp/package.json <<'EOF'
{
  "name": "myapp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@liveblocks/client": "^2.21.0",
    "@liveblocks/node": "^2.21.0",
    "@liveblocks/react": "^2.21.0",
    "@liveblocks/react-ui": "^2.21.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.12.7",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.4"
  }
}
EOF

# tsconfig.json
RUN cat >/home/user/myapp/tsconfig.json <<'EOF'
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
EOF

# next.config.mjs
RUN cat >/home/user/myapp/next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;
EOF

# next-env.d.ts
RUN cat >/home/user/myapp/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

# app/layout.tsx
RUN cat >/home/user/myapp/app/layout.tsx <<'EOF'
import "@liveblocks/react-ui/styles.css";
import { Providers } from "./Providers";

export const metadata = {
  title: "Inbox",
  description: "Liveblocks inbox notifications feed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

# app/Providers.tsx — agent must keep this LiveblocksProvider in place.
RUN cat >/home/user/myapp/app/Providers.tsx <<'EOF'
"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {children}
    </LiveblocksProvider>
  );
}
EOF

# app/page.tsx — landing page with a link to the inbox.
RUN cat >/home/user/myapp/app/page.tsx <<'EOF'
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>
        Go to the <Link href="/inbox">inbox</Link>.
      </p>
    </main>
  );
}
EOF

# app/inbox/page.tsx — STUB: the agent must replace this with a real implementation.
RUN cat >/home/user/myapp/app/inbox/page.tsx <<'EOF'
"use client";

// TODO(agent): Render the authenticated user's Liveblocks inbox feed here.
// See instruction.md for the full requirements and required data-testid
// attributes.

export default function InboxPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Inbox</h1>
      <p>TODO: implement the Liveblocks inbox.</p>
    </main>
  );
}
EOF

# app/rooms/[roomId]/page.tsx — destination after clicking a notification.
RUN cat >/home/user/myapp/app/rooms/[roomId]/page.tsx <<'EOF'
export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Room {params.roomId}</h1>
      <p>Thread page placeholder.</p>
    </main>
  );
}
EOF

# app/api/liveblocks-auth/route.ts — identifies the request user as user-1.
RUN cat >/home/user/myapp/app/api/liveblocks-auth/route.ts <<'EOF'
import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(_request: NextRequest) {
  // For this task the authenticated user is always "user-1".
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: "user-1",
      groupIds: [],
    },
    {
      userInfo: {
        name: "User One",
        color: "#4F46E5",
      },
    }
  );

  return new Response(body, { status });
}
EOF

# Pre-install all dependencies so the agent does not need network access.
RUN cd /home/user/myapp && npm install --no-audit --no-fund

# ---------------------------------------------------------------------------
LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks inbox notifications feed task with deps pre-installed and pochi-verifier ready for browser checks."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v20 from NodeSource
#   - browser verification deps: pochi-verifier, agent-browser, ffmpeg, shared libs
#   - extra pip3 packages: pytest-xprocess, requests (used by tests)
#   - /home/user/myapp: Next.js (App Router) scaffold with @liveblocks/{client,node,react,react-ui} pre-installed
#       * app/Providers.tsx wraps the tree in <LiveblocksProvider authEndpoint="/api/liveblocks-auth">.
#       * app/api/liveblocks-auth/route.ts identifies the request user as "user-1".
#       * app/inbox/page.tsx is a deliberate stub that does NOT yet call any
#         Liveblocks inbox hook (the agent must wire those up).
#       * @liveblocks/react-ui/styles.css imported from app/layout.tsx.
