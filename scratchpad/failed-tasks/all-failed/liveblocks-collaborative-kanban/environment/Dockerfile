FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm i -g agent-browser && \
    agent-browser install && \
    pip3 install --break-system-packages \
        pytest-json-ctrf \
        pytest-xprocess \
        requests \
        playwright \
        pochi-verifier && \
    python3 -m playwright install --with-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# ---------------------------------------------------------------------------
# Create the Next.js + Liveblocks scaffold at /home/user/myproject.
# The scaffold renders the three column titles but DOES NOT implement card
# CRUD or drag-and-drop. The executor must complete the implementation.
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth && \
    mkdir -p /home/user/myproject/app && \
    cd /home/user/myproject && \
    cat > package.json <<'EOF'
{
  "name": "liveblocks-collaborative-kanban",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "@liveblocks/client": "^2.20.0",
    "@liveblocks/node": "^2.20.0",
    "@liveblocks/react": "^2.20.0",
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-dnd": "16.0.1",
    "react-dnd-html5-backend": "16.0.1"
  },
  "devDependencies": {
    "@types/node": "20.12.12",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.4.5"
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
    cat > liveblocks.config.ts <<'EOF'
// Liveblocks configuration scaffold.
// TODO: Define Storage types (columns: LiveList<...>, cards: LiveMap<...>) and
// export typed hooks (useStorage, useMutation, etc.) using createRoomContext or
// the suspense exports from "@liveblocks/react/suspense".
import { createClient } from "@liveblocks/client";

export const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});
EOF

RUN cd /home/user/myproject && \
    cat > .env.example <<'EOF'
# Required Liveblocks credentials (real cloud — do NOT mock).
LIVEBLOCKS_SECRET_KEY=sk_dev_replace_me
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_replace_me
# ZEALT_RUN_ID is provided by the evaluation harness at runtime and is used to
# scope the Liveblocks room id per evaluation run. The browser cannot read
# server-only env vars, so the agent MUST re-export it under the NEXT_PUBLIC_
# prefix (e.g. via next.config.js `env` or by writing it into the build env)
# so the client sees `NEXT_PUBLIC_ZEALT_RUN_ID === process.env.ZEALT_RUN_ID`.
# ZEALT_RUN_ID=local
EOF

RUN cd /home/user/myproject && \
    cat > README.md <<'EOF'
# Liveblocks Collaborative Kanban (Scaffold)

This is a starter scaffold for a Liveblocks-powered Kanban board. The empty
columns are already rendered; the executor must implement add/edit/delete and
drag-and-drop between columns using `useMutation`, `LiveList`, `LiveObject`, and
`LiveMap`.

## Required environment variables

- `LIVEBLOCKS_SECRET_KEY` — server-side secret used by `/api/liveblocks-auth`.
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` — public key for the browser client.
- `ZEALT_RUN_ID` — used to derive the room id (`kanban-${id}`). The harness only
  provides `ZEALT_RUN_ID`; the agent must mirror it into the client by setting
  `NEXT_PUBLIC_ZEALT_RUN_ID` (e.g. in `next.config.js` `env`) so the browser
  bundle can read it as `process.env.NEXT_PUBLIC_ZEALT_RUN_ID`.

## Scripts

- `npm run dev` — development server.
- `npm run build && npm run start` — production build & start on port 3000.
EOF

RUN cd /home/user/myproject && \
    cat > app/layout.tsx <<'EOF'
import type { ReactNode } from "react";

export const metadata = {
  title: "Liveblocks Collaborative Kanban",
  description: "Collaborative Kanban scaffold powered by Liveblocks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
EOF

RUN cd /home/user/myproject && \
    cat > app/page.tsx <<'EOF'
// Scaffold page: renders the three Kanban columns with their titles.
// TODO: Wrap this with a RoomProvider, define Storage (columns + cards) and
// implement card CRUD + drag-and-drop using useMutation / LiveList / LiveMap.

const COLUMN_TITLES = ["To Do", "In Progress", "Done"] as const;

export default function KanbanPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Kanban</h1>
      <p>
        Scaffold only — implement the card CRUD and drag-and-drop with
        Liveblocks Storage to complete this task.
      </p>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {COLUMN_TITLES.map((title) => (
          <div
            key={title}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              minHeight: 240,
            }}
            data-column-title={title}
          >
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: "#888", fontSize: 14 }}>No cards yet.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
EOF

RUN cd /home/user/myproject && \
    cat > app/api/liveblocks-auth/route.ts <<'EOF'
// Liveblocks auth endpoint scaffold.
// TODO: Implement with `Liveblocks.prepareSession` (or `identifyUser`) using
// LIVEBLOCKS_SECRET_KEY and grant access to rooms whose id starts with
// "kanban-". The endpoint must return the auth token JSON.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Liveblocks auth endpoint not implemented yet" },
    { status: 501 }
  );
}
EOF

# Pre-install npm dependencies so test_initial_state.py finds node_modules/ ready.
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error && \
    npm cache clean --force

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js + Liveblocks Kanban scaffold with Node.js 20, Playwright Chromium, and pre-installed dependencies."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep + Playwright browser system libs
#   - pip3 packages: pytest-json-ctrf, pytest-xprocess, requests, playwright (with Chromium), pochi-verifier
#   - Node.js v20 for Next.js, agent-browser CLI
#   - /home/user/myproject: Next.js scaffold (3-column UI, Liveblocks auth route stub, no card CRUD)
#   - /home/user/myproject/node_modules: pre-installed dependencies (Liveblocks, Next.js, react-dnd, ...)
