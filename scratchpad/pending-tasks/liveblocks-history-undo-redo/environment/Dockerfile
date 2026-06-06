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
RUN mkdir -p /home/user/project/app/palette/\[room\] && \
    mkdir -p /home/user/project/app/api/liveblocks-auth

WORKDIR /home/user/project

RUN cat >/home/user/project/package.json <<'EOF'
{
  "name": "liveblocks-history-undo-redo",
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
import type { LiveList } from "@liveblocks/client";

/**
 * Storage layout for the collaborative color palette.
 *
 * `palette` is a LiveList of CSS-color strings. The executor must use this
 * type together with `useStorage`/`useMutation` to read and write the list,
 * and wire up history (undo / redo / pause / resume) on top.
 */
export type Storage = {
  palette: LiveList<string>;
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
  title: "Liveblocks Color Palette",
  description: "Collaborative color palette with history (undo/redo)"
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

RUN cat >/home/user/project/app/page.tsx <<'EOF'
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Liveblocks Color Palette</h1>
      <p>
        Open <Link href="/palette/demo">/palette/demo</Link> to try the
        collaborative palette with undo/redo.
      </p>
    </main>
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

# Room provider helper — the LiveList<string> is already wired with
# initialStorage so first-visit rooms get an empty palette.
RUN cat >/home/user/project/app/palette/\[room\]/Room.tsx <<'EOF'
"use client";

import { LiveList } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

export function Room({ roomId, children }: { roomId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialStorage={{ palette: new LiveList<string>([]) }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {() => <>{children}</>}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

# Palette starter page: the add/delete/edit UI and Storage mutations are
# already wired up, but the history wiring (undo, redo, can-undo / can-redo,
# and drag-batching via the history primitives) is intentionally NOT wired
# so the executor can implement it.
RUN cat >/home/user/project/app/palette/\[room\]/page.tsx <<'EOF'
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { Room } from "./Room";

// TODO: implement the Liveblocks history requirements described in
// instruction.md. See the task instructions for the full DOM contract
// (undo / redo controls, can-undo / can-redo wiring, and the drag-edit
// batching button). The LiveList<string> Storage layout and the
// add / delete / edit mutations below are already in place.

function PaletteEditor() {
  const palette = useStorage((root) => root.palette);
  const [draft, setDraft] = useState("");
  const [edits, setEdits] = useState<Record<number, string>>({});

  const addColor = useMutation(({ storage }, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    storage.get("palette").push(trimmed);
  }, []);

  const setColor = useMutation(({ storage }, index: number, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    storage.get("palette").set(index, trimmed);
  }, []);

  const deleteColor = useMutation(({ storage }, index: number) => {
    storage.get("palette").delete(index);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Color Palette</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addColor(draft);
          setDraft("");
        }}
      >
        <input
          data-testid="new-color-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. red or #00ff00"
        />
        <button data-testid="add-color" type="submit">
          Add color
        </button>
      </form>

      {/* TODO(history): render the history controls here per instruction.md. */}

      <ul>
        {palette.map((color, index) => (
          <li
            key={index}
            data-testid="palette-row"
            data-index={index}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              data-testid="color-label"
              style={{
                display: "inline-block",
                padding: "2px 6px",
                background: color
              }}
            >
              {color}
            </span>
            <input
              data-testid="color-edit-input"
              defaultValue={edits[index] ?? color}
              onChange={(e) =>
                setEdits((prev) => ({ ...prev, [index]: e.target.value }))
              }
            />
            <button
              data-testid="color-save"
              type="button"
              onClick={() => {
                const next = edits[index];
                if (typeof next === "string") setColor(index, next);
              }}
            >
              Save
            </button>
            <button
              data-testid="color-delete"
              type="button"
              onClick={() => deleteColor(index)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function PalettePage() {
  const params = useParams<{ room: string }>();
  const roomId =
    (Array.isArray(params?.room) ? params?.room[0] : params?.room) ||
    "default-room";

  return (
    <Room roomId={roomId}>
      <PaletteEditor />
    </Room>
  );
}
EOF

# Install dependencies ahead of time so the executor (and tests) do not pay
# the install cost at run time.
RUN cd /home/user/project && \
    npm install --no-audit --no-fund --loglevel=error

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js 14 + Liveblocks starter for the history-undo-redo task. Provides a palette LiveList<string> with add/delete/edit wired up; the executor must add undo/redo/pause/resume on top."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt packages: curl wget ca-certificates git python3 python3-pip
#     python3-pytest bash ripgrep + Playwright system libs + ffmpeg
#   - Node.js v20 (LTS) via NodeSource
#   - pip3 packages: pytest-json-ctrf requests pytest-xprocess playwright
#   - Playwright Chromium pre-installed for browser verification
#   - /home/user/project: Next.js 14 + Liveblocks starter with the palette
#     skeleton at app/palette/[room]/page.tsx (history hooks TODO),
#     `/api/liveblocks-auth` already wired with @liveblocks/node, and
#     liveblocks.config.ts declaring Storage.palette as LiveList<string>.
#   - node_modules pre-installed.
