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

# --- Scaffold the Next.js + Liveblocks spreadsheet starter project ----------
RUN mkdir -p /home/user/project/app

WORKDIR /home/user/project

RUN cat >/home/user/project/package.json <<'EOF'
{
  "name": "liveblocks-spreadsheet-cells",
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

# Global Liveblocks types: Presence carries the cell being edited, Storage
# carries the LiveMap<string, string> of cell labels to raw cell values.
RUN cat >/home/user/project/liveblocks.config.ts <<'EOF'
import type { LiveMap } from "@liveblocks/client";

export type Presence = {
  editingCell: string | null;
};

export type Storage = {
  cells: LiveMap<string, string>;
};

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

export const CELL_LABELS: string[] = (() => {
  const labels: string[] = [];
  for (const col of ["A", "B", "C", "D", "E"]) {
    for (const row of [1, 2, 3, 4, 5]) {
      labels.push(`${col}${row}`);
    }
  }
  return labels;
})();
EOF

RUN cat >/home/user/project/app/layout.tsx <<'EOF'
import React from "react";

export const metadata = {
  title: "Liveblocks Collaborative Spreadsheet",
  description: "A 5x5 collaborative spreadsheet powered by Liveblocks Storage"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>{children}</body>
    </html>
  );
}
EOF

# Scaffold page: renders a 5x5 grid with the right data-cell attributes so the
# initial-state test passes, but does NOT wire up Liveblocks editing, presence,
# or formula evaluation. The executor must add those (including the
# data-remote-editing attribute, the click-to-edit behavior, and the SUM
# formula evaluator).
RUN cat >/home/user/project/app/page.tsx <<'EOF'
"use client";

// Inline the 25 cell labels so the static initial-state test can see them.
const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5"
];

export default function SpreadsheetPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <p>TODO: wire this 5x5 grid to Liveblocks Storage, Presence, and add a SUM formula evaluator.</p>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 80px)",
          gridAutoRows: "32px",
          gap: 0,
          marginTop: 16
        }}
      >
        {CELL_LABELS.map((label) => (
          <div
            key={label}
            role="gridcell"
            data-cell={label}
            style={{
              border: "1px solid #ccc",
              padding: "4px 6px",
              boxSizing: "border-box",
              fontFamily: "monospace"
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </main>
  );
}
EOF

# Pre-install dependencies so the executor (and tests) do not pay the install
# cost at runtime.
RUN cd /home/user/project && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks starter for the collaborative-spreadsheet task. Pre-installs Node 20, Playwright Chromium, the Liveblocks SDK, and a 5x5 cell-grid scaffold at /home/user/project."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip
#     python3-pytest bash ripgrep + Playwright system libs + ffmpeg
#   - Node.js v20 (LTS) via NodeSource
#   - pip3 packages: pytest-json-ctrf requests pytest-xprocess playwright
#   - Playwright Chromium pre-installed for two-context verification
#   - /home/user/project: Next.js 14 + Liveblocks scaffold rendering a static
#     5x5 grid of cells (data-cell="A1".."E5"). Cell editing, the presence
#     based remote-editing indicator (data-remote-editing), and the SUM
#     formula evaluator are intentionally left for the executor to add.
#   - node_modules pre-installed.
