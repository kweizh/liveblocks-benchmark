# syntax=docker/dockerfile:1.7
FROM ubuntu:24.04

# ---------------------------------------------------------------------------
# Base system + Node.js 20 + Playwright (Python) + verifier runtime deps
# ---------------------------------------------------------------------------
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest python3-venv \
        bash ripgrep gnupg \
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
        playwright \
        requests && \
    python3 -m playwright install chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# User home directory
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user && chmod 0755 /home/user

# ---------------------------------------------------------------------------
# Scaffold a minimal Next.js + Liveblocks project at /home/user/myproject.
# The scaffold intentionally does NOT include any mind-map behaviour — the
# executor must add nodes, edges, drag, rename, and recursive deletion.
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myproject/pages

# package.json — Next.js + Liveblocks, no mind-map markers anywhere.
RUN cat > /home/user/myproject/package.json <<'JSON'
{
  "name": "mindmap",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "@liveblocks/client": "^2.20.0",
    "@liveblocks/react": "^2.20.0",
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
JSON

# tsconfig.json
RUN cat > /home/user/myproject/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
JSON

# next-env.d.ts
RUN cat > /home/user/myproject/next-env.d.ts <<'TS'
/// <reference types="next" />
/// <reference types="next/types/global" />
TS

# next.config.js — forwards ZEALT_RUN_ID to the client bundle.
RUN cat > /home/user/myproject/next.config.js <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || "local",
  },
};
module.exports = nextConfig;
JS

# .env.local placeholder — real values are injected via container env vars
# at runtime and override these placeholders when next dev starts.
RUN cat > /home/user/myproject/.env.local <<'ENV'
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
ENV

# pages/_app.tsx — the room/provider wiring. Intentionally minimal: the
# executor must define Storage types and may need to add initialStorage.
RUN cat > /home/user/myproject/pages/_app.tsx <<'TSX'
import type { AppProps } from "next/app";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";

const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `mind-map-${RUN_ID}`;

export default function App({ Component, pageProps }: AppProps) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider id={ROOM_ID} initialPresence={{}}>
        <Component {...pageProps} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
TSX

# pages/index.tsx — placeholder home page with an empty container. The
# executor must replace this with the collaborative SVG mind map.
RUN cat > /home/user/myproject/pages/index.tsx <<'TSX'
export default function Page() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#f8fafc",
      }}
    >
      <h1 style={{ padding: 16 }}>Collaborative Mind Map</h1>
      <p style={{ padding: "0 16px", color: "#64748b" }}>
        The collaborative SVG mind-map canvas is not yet implemented.
      </p>
    </main>
  );
}
TSX

# Install dependencies so the project is ready to `npm run dev` immediately.
WORKDIR /home/user/myproject
RUN npm install --no-audit --no-fund --loglevel=error

WORKDIR /

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js 20 + Next.js + Liveblocks scaffold for the mind-map nodes task, with Playwright (Python) for two-context cross-user verification."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest python3-venv bash ripgrep gnupg
#       + Playwright browser system libs
#   - required pip3 packages: pytest-json-ctrf pytest-xprocess playwright requests (Playwright Chromium installed)
#   - Node.js 20 installed via nodesource (for Next.js dev server)
#   - /home/user/myproject: scaffolded Next.js + Liveblocks project (empty canvas placeholder)
#   - /home/user/myproject/node_modules: pre-installed npm dependencies (next, @liveblocks/client, @liveblocks/react)
