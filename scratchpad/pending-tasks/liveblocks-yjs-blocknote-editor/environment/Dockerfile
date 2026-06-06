FROM ubuntu:24.04

# Base system + Python tools + browser shared libs (needed for Playwright Chromium)
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
# Initial scaffold: a Next.js 14 App Router project at /home/user/myproject
# with a single-player BlockNote editor (NO Liveblocks Yjs wiring yet).
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myproject/app/editor

WORKDIR /home/user/myproject

RUN cat > package.json <<'EOF'
{
  "name": "liveblocks-yjs-blocknote-editor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "@blocknote/core": "0.23.5",
    "@blocknote/mantine": "0.23.5",
    "@blocknote/react": "0.23.5",
    "@liveblocks/client": "2.21.0",
    "@liveblocks/node": "2.21.0",
    "@liveblocks/react": "2.21.0",
    "@liveblocks/yjs": "2.21.0",
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "yjs": "13.6.20"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.5.3"
  }
}
EOF

RUN cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
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

RUN cat > next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { typedRoutes: false }
};
export default nextConfig;
EOF

RUN cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

RUN cat > app/layout.tsx <<'EOF'
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

export const metadata = {
  title: "BlockNote Liveblocks Editor",
  description: "Scaffold"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

RUN cat > app/page.tsx <<'EOF'
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>BlockNote Liveblocks Editor scaffold</h1>
      <p>
        Open the editor at{" "}
        <Link href="/editor?room=demo">/editor?room=demo</Link>.
      </p>
    </main>
  );
}
EOF

RUN cat > app/editor/page.tsx <<'EOF'
"use client";

// Initial single-player BlockNote scaffold.
// The Liveblocks Yjs collaboration layer is NOT wired yet — the executor
// must add it as part of the task.

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

export default function EditorPage() {
  const editor = useCreateBlockNote();
  return (
    <main style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>BlockNote editor (single-player scaffold)</h2>
      <BlockNoteView editor={editor} />
    </main>
  );
}
EOF

# Pre-install npm dependencies so the executor can work offline.
RUN cd /home/user/myproject && npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 scaffold with BlockNote (Mantine) preinstalled; Liveblocks Yjs collaboration layer to be wired by the executor."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - browser shared libraries + Playwright Chromium (installed via `python3 -m playwright install chromium`)
#   - Node.js v20 for the Next.js + BlockNote stack
#   - Python deps for tests: pytest-xprocess, requests, playwright
#   - /home/user/myproject: pre-scaffolded Next.js 14 App Router project
#     * /home/user/myproject/package.json — Next.js, React 18, BlockNote, Yjs, @liveblocks/{client,react,yjs,node}
#     * /home/user/myproject/app/editor/page.tsx — single-player BlockNote editor scaffold
#     * /home/user/myproject/node_modules — npm dependencies pre-installed
