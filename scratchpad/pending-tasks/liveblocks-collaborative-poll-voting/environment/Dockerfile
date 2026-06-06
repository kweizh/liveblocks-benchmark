FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        ffmpeg libxcb-shm0 libx11-xcb1 libx11-6 libxcb1 libxext6 libxrandr2 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libgtk-3-0t64 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0t64 libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libxrender1 libasound2t64 libfreetype6 libfontconfig1 libdbus-1-3 libnss3 libnspr4 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 libcups2t64 libxshmfence1 libgbm1 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf pytest-xprocess requests playwright && \
    python3 -m playwright install chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

# Pre-create the Next.js scaffold required by test_initial_state.py.
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth

RUN cat > /home/user/myproject/package.json <<'EOF'
{
  "name": "liveblocks-poll-voting",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "@liveblocks/client": "2.13.1",
    "@liveblocks/node": "2.13.1",
    "@liveblocks/react": "2.13.1",
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.16.10",
    "@types/react": "18.3.11",
    "@types/react-dom": "18.3.0",
    "typescript": "5.6.2"
  }
}
EOF

RUN cat > /home/user/myproject/tsconfig.json <<'EOF'
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

RUN cat > /home/user/myproject/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

RUN cat > /home/user/myproject/next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose ZEALT_RUN_ID to the browser so the page can derive a unique room id.
  env: {
    NEXT_PUBLIC_ZEALT_RUN_ID: process.env.ZEALT_RUN_ID || "local",
  },
};

module.exports = nextConfig;
EOF

RUN cat > /home/user/myproject/liveblocks.config.ts <<'EOF'
// Skeleton — agents must define Storage/Presence types and re-export
// the typed Liveblocks React hooks here.
//
// Suggested Storage shape (to be implemented):
//   poll: LiveObject<{ question: string; options: LiveList<LiveObject<{ id: string; label: string }>> }>
//   votes: LiveMap<string /* userId */, string /* optionId */>
//
// Suggested UserMeta:
//   { id: string; info: { name: string; color: string; role: "owner" | "voter" } }

export {};
EOF

RUN cat > /home/user/myproject/app/layout.tsx <<'EOF'
export const metadata = {
  title: "Liveblocks Poll",
  description: "Collaborative poll voting",
};

export default function RootLayout({
  children,
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

RUN cat > /home/user/myproject/app/page.tsx <<'EOF'
"use client";

// Skeleton — implement the collaborative poll voting UI here.
//
// Required behaviour (see instruction.md for full spec):
//   * Read userId & name from URL query params.
//   * Mount LiveblocksProvider with authEndpoint="/api/liveblocks-auth".
//   * Mount RoomProvider with id `poll-room-${NEXT_PUBLIC_ZEALT_RUN_ID}` and an
//     initialStorage that contains an empty poll and an empty votes map.
//   * Render the poll question, options, voting controls, percentage bars,
//     and a "Total votes: N" element using the data-testid attributes
//     documented in instruction.md.
//   * Gate owner-only controls on `useSelf((me) => me.info.role) === "owner"`.

export default function PollPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Liveblocks Collaborative Poll</h1>
      <p>Poll voting scaffold — implement me.</p>
    </main>
  );
}
EOF

RUN cat > /home/user/myproject/app/api/liveblocks-auth/route.ts <<'EOF'
// Skeleton — implement Liveblocks ID-token authentication here.
//
// Required behaviour:
//   * Parse JSON body { userId: string, name: string }.
//   * Use `@liveblocks/node` `Liveblocks` client with
//     process.env.LIVEBLOCKS_SECRET_KEY.
//   * Call `liveblocks.identifyUser({ userId, groupIds: ["poll-room"] },
//     { userInfo: { name, color, role } })`.
//   * Set `role = "owner"` when userId === "alice", otherwise "voter".
//   * Return the resulting body & status from the SDK call.

import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Not implemented. See instruction.md." },
    { status: 501 }
  );
}
EOF

# Pre-install Node dependencies so the executor environment matches the
# initial-state contract (node_modules present and ready to use).
RUN cd /home/user/myproject && npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Liveblocks collaborative poll voting (Next.js) task scaffold with Node.js 20, Playwright Chromium, and pre-installed dependencies."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - browser libs + Playwright Chromium for two-context UI verification
#   - Node.js 20 (per task requirements) for the Next.js poll app
#   - /home/user/myproject: Next.js 14 (app router) scaffold with
#       package.json, tsconfig.json, next.config.js, liveblocks.config.ts,
#       app/layout.tsx, app/page.tsx (skeleton, no voting markers),
#       app/api/liveblocks-auth/route.ts (skeleton 501 handler),
#       and pre-installed node_modules (next, react, react-dom,
#       @liveblocks/client, @liveblocks/react, @liveblocks/node).
