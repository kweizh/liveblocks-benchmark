FROM ubuntu:24.04

# Base system packages + browser dependencies (for Playwright) + Node.js 20 + Python tooling.
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests pytest-xprocess playwright && \
    python3 -m playwright install chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Create the Next.js 14 App Router project skeleton at /home/user/myproject.
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth && \
    mkdir -p /home/user/myproject/app/rooms/'[roomId]' && \
    cd /home/user/myproject && \
    cat > package.json <<'EOF'
{
  "name": "liveblocks-nextjs-auth-organization",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@liveblocks/client": "^2.20.2",
    "@liveblocks/node": "^2.20.2",
    "@liveblocks/react": "^2.20.2",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.4"
  }
}
EOF

RUN cd /home/user/myproject && \
    cat > tsconfig.json <<'EOF'
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
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

RUN cd /home/user/myproject && \
    cat > next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
EOF

RUN cd /home/user/myproject && \
    cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

RUN cd /home/user/myproject && \
    cat > app/layout.tsx <<'EOF'
import type { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Org Auth Demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

RUN cd /home/user/myproject && \
    cat > app/page.tsx <<'EOF'
export default function HomePage() {
  return (
    <main>
      <h1>Liveblocks Org Auth Demo</h1>
      <p>
        Visit <code>/rooms/&lt;roomId&gt;?userId=&lt;id&gt;&amp;orgId=&lt;org&gt;</code>
        to enter a room.
      </p>
    </main>
  );
}
EOF

# Auth route stub: returns HTTP 501 until the executor implements it.
RUN cd /home/user/myproject && \
    cat > app/api/liveblocks-auth/route.ts <<'EOF'
import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement the Liveblocks ID-token authentication endpoint.
  // The executor must:
  //   * Parse `room`, `userId`, and `orgId` from the JSON request body.
  //   * Reject malformed requests with HTTP 400 and { error: string }.
  //   * Reject org mismatches / unknown orgs with HTTP 403 and { error: string }.
  //   * Mint an ID token via @liveblocks/node and return the upstream response.
  return NextResponse.json(
    { error: "Not implemented. Implement the Liveblocks auth endpoint." },
    { status: 501 },
  );
}
EOF

# Room page stub. The executor must replace this with a real LiveblocksProvider + RoomProvider implementation.
RUN cd /home/user/myproject && \
    cat > 'app/rooms/[roomId]/page.tsx' <<'EOF'
"use client";

// TODO: Implement the real-time room UI.
// The executor must:
//   * Mount <LiveblocksProvider authEndpoint={...callback...}> using a callback that POSTs
//     { room, userId, orgId } to /api/liveblocks-auth.
//   * Mount <RoomProvider id={params.roomId} initialStorage={{ counter: 0 }}>.
//   * Render the connection status in an element with data-testid="connection-status".
//   * Render the counter value in an element with data-testid="counter-value".

export default function RoomPageStub() {
  return (
    <main>
      <h1>Room page stub</h1>
      <p>Not implemented yet.</p>
      <span data-testid="connection-status">stub</span>
      <span data-testid="counter-value">stub</span>
    </main>
  );
}
EOF

# Install dependencies inside the image so node_modules is pre-populated.
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error && \
    npm cache clean --force

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 App Router skeleton for the Liveblocks per-organization ID-token auth task, with Node.js 20, Playwright/Chromium, and pre-installed @liveblocks/{node,client,react} dependencies."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - extra pip3 packages: requests, pytest-xprocess, playwright (with chromium browser)
#   - browser system deps for headless Chromium
#   - Node.js 20 from NodeSource
#   - /home/user/myproject: Next.js 14 App Router project skeleton
#       * package.json declares next, react, react-dom, @liveblocks/{node,client,react}
#       * app/api/liveblocks-auth/route.ts: 501 stub (no identifyUser yet)
#       * app/rooms/[roomId]/page.tsx: client-component stub with placeholder test-ids
#       * node_modules pre-installed via `npm install`
