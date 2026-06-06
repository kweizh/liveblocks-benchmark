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
# Next.js + Tiptap + Liveblocks (Yjs) skeleton at /home/user/myproject
# ---------------------------------------------------------------------------
RUN mkdir -p /home/user/myproject/app/api/liveblocks-auth && \
    mkdir -p "/home/user/myproject/app/r/[roomId]" && \
    mkdir -p /home/user/myproject/components

WORKDIR /home/user/myproject

# package.json — Next.js + React + Liveblocks + Yjs + Tiptap dependencies.
RUN cat >/home/user/myproject/package.json <<'EOF'
{
  "name": "liveblocks-yjs-tiptap-editor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@liveblocks/client": "2.20.0",
    "@liveblocks/node": "2.20.0",
    "@liveblocks/react": "2.20.0",
    "@liveblocks/yjs": "2.20.0",
    "@tiptap/extension-collaboration": "^2.10.0",
    "@tiptap/extension-collaboration-cursor": "^2.10.0",
    "@tiptap/pm": "^2.10.0",
    "@tiptap/react": "^2.10.0",
    "@tiptap/starter-kit": "^2.10.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "yjs": "^13.6.18"
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

RUN cat >/home/user/myproject/next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};
module.exports = nextConfig;
EOF

RUN cat >/home/user/myproject/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

# liveblocks.config.ts — declares Presence/UserMeta types.
RUN cat >/home/user/myproject/liveblocks.config.ts <<'EOF'
declare global {
  interface Liveblocks {
    Presence: Record<string, unknown>;
    Storage: Record<string, never>;
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
      };
    };
    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
EOF

# /api/liveblocks-auth — STUB. The executor must implement this to issue a
# real Liveblocks ID-token session using LIVEBLOCKS_SECRET_KEY, attaching the
# user's display name and color via UserMeta info.
RUN cat >/home/user/myproject/app/api/liveblocks-auth/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO(executor): wire up @liveblocks/node here.
  //   1. Read LIVEBLOCKS_SECRET_KEY from env.
  //   2. Determine the user's display name (e.g., from a cookie named "username"
  //      or the request body, with a random anon fallback).
  //   3. Pick a deterministic color per user.
  //   4. Use `new Liveblocks({ secret }).identifyUser(...)` (or prepareSession)
  //      to grant access to every room and return { token }.
  return NextResponse.json(
    { error: "TODO(executor): implement /api/liveblocks-auth" },
    { status: 501 }
  );
}
EOF

# Root layout
RUN cat >/home/user/myproject/app/layout.tsx <<'EOF'
import "./globals.css";

export const metadata = {
  title: "Liveblocks Yjs Tiptap Editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

RUN cat >/home/user/myproject/app/globals.css <<'EOF'
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
button { cursor: pointer; }

.toolbar { display: flex; gap: 6px; margin-bottom: 12px; }
.toolbar button { padding: 4px 10px; }

.editor {
  border: 1px solid #ccc;
  padding: 12px;
  min-height: 200px;
  border-radius: 4px;
}
.editor:focus { outline: 2px solid #4a90e2; }

.connected-users { display: flex; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.connected-user { padding: 2px 8px; border-radius: 999px; background: #eee; font-size: 13px; }
EOF

# Root page redirects to a default demo room (purely informational).
RUN cat >/home/user/myproject/app/page.tsx <<'EOF'
export default function HomePage() {
  return (
    <main>
      <h1>Liveblocks Yjs Tiptap Editor</h1>
      <p>Open a room at <code>/r/&lt;roomId&gt;</code>.</p>
    </main>
  );
}
EOF

# /r/[roomId]/page.tsx — server component that renders the client Room.
RUN cat >"/home/user/myproject/app/r/[roomId]/page.tsx" <<'EOF'
import Room from "./Room";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return <Room roomId={params.roomId} />;
}
EOF

# /r/[roomId]/Room.tsx — wraps the Editor with LiveblocksProvider + RoomProvider.
# The authEndpoint is `/api/liveblocks-auth`. The executor may modify this file
# to pass the user's `username` to the auth endpoint.
RUN cat >"/home/user/myproject/app/r/[roomId]/Room.tsx" <<'EOF'
"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import Editor from "./Editor";

export default function Room({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading room…</div>}>
          {() => <Editor />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
EOF

# /r/[roomId]/Editor.tsx — single-user Tiptap editor with StarterKit only.
# The executor must wire it up to the Liveblocks Yjs provider, add the
# Collaboration / CollaborationCursor extensions, add the formatting toolbar,
# and add the connected-users indicator.
RUN cat >"/home/user/myproject/app/r/[roomId]/Editor.tsx" <<'EOF'
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  return (
    <main>
      <h1>Collaborative Editor</h1>
      {/* TODO(executor):
            - Add a toolbar above the editor with buttons
              `toolbar-bold`, `toolbar-italic`, `toolbar-h1`, `toolbar-h2`,
              `toolbar-bullet-list` that toggle the corresponding Tiptap
              marks/nodes on the current selection.
            - Add a `connected-users` indicator that lists all active users
              by name using `useSelf()` + `useOthers()`, with class
              `connected-user` on each row, and a summary element with
              `data-testid="connected-count"` whose text is `N connected`.
            - Wire up Yjs sync via @liveblocks/yjs (LiveblocksYjsProvider or
              getYjsProviderForRoom) and feed the Y.Doc into the Collaboration
              extension. Configure CollaborationCursor with the current
              user's name/color from useSelf().info. Disable StarterKit's
              built-in history (`history: false`) because Collaboration
              brings its own. */}
      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
EOF

# README — orientation for the executor.
RUN cat >/home/user/myproject/README.md <<'EOF'
# Liveblocks + Yjs + Tiptap Collaborative Editor

A Next.js (App Router) scaffold for a realtime collaborative rich-text editor.
The scaffold currently renders a single-user Tiptap editor with StarterKit.

You must finish wiring up:

- The `@liveblocks/yjs` provider (Y.Doc sync via Liveblocks cloud).
- Tiptap's `Collaboration` + `CollaborationCursor` extensions.
- A formatting toolbar (Bold / Italic / H1 / H2 / Bullet List).
- A connected-users indicator using `useSelf()` + `useOthers()`.
- The `POST /api/liveblocks-auth` route (currently returns 501) — it must
  return a real Liveblocks ID-token session with the user's display name
  and color stored as `UserMeta.info`.

Required env vars (already provided in the container):

- `LIVEBLOCKS_SECRET_KEY`
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`

Run `npm run dev` to start the app on port 3000.
EOF

RUN cat >/home/user/myproject/.env.example <<'EOF'
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
EOF

# Install dependencies — pre-installed so the executor doesn't need network.
RUN cd /home/user/myproject && \
    npm install --no-audit --no-fund --loglevel=error --legacy-peer-deps

WORKDIR /home/user

LABEL Author="generate-harbor-tasks"
LABEL Description="Next.js + Tiptap + Yjs + Liveblocks scaffold for the collaborative rich-text editor task, with Playwright browser verification dependencies installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - apt: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep + Playwright Chromium runtime libs
#   - pip3: pytest-json-ctrf, pytest-xprocess, requests, playwright (Chromium downloaded)
#   - Node.js v20 for the Next.js task environment
#   - /home/user/myproject:
#       - Next.js 14 App Router scaffold
#       - LiveblocksProvider + RoomProvider already wired at /r/[roomId]
#       - Tiptap editor with StarterKit only (no Collaboration / CollaborationCursor yet)
#       - /api/liveblocks-auth returns 501 (executor must implement)
#       - All Tiptap, Yjs, and Liveblocks (including @liveblocks/yjs) deps pre-installed
