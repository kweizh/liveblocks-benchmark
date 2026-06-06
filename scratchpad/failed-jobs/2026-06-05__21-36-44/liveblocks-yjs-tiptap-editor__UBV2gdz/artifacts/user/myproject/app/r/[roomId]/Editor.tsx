"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf, useOthers } from "@liveblocks/react/suspense";

export default function Editor() {
  const room = useRoom();
  const selfInfo = useSelf((me) => me.info);
  const others = useOthers();

  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yjsProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yjsProvider);

    return () => {
      yjsProvider.destroy();
      yDoc.destroy();
    };
  }, [room]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        ...(doc
          ? [
              Collaboration.configure({ document: doc }),
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: selfInfo?.name ?? "Anonymous",
                  color: selfInfo?.color ?? "#aabbcc",
                },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: "editor",
        },
      },
    },
    [doc, provider]
  );

  // Build the connected users list: self + others
  const allUsers = [
    ...(selfInfo ? [{ id: "self", name: selfInfo.name }] : []),
    ...others.map((o) => ({ id: String(o.connectionId), name: o.info?.name ?? "Anonymous" })),
  ];

  return (
    <main>
      <h1>Collaborative Editor</h1>

      {/* Connected users indicator */}
      <div className="connected-users">
        {allUsers.map((u) => (
          <span key={u.id} className="connected-user">
            {u.name}
          </span>
        ))}
      </div>
      <div data-testid="connected-count">{allUsers.length} connected</div>

      {/* Formatting toolbar */}
      <div className="toolbar">
        <button
          data-testid="toolbar-bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor}
        >
          Bold
        </button>
        <button
          data-testid="toolbar-italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor}
        >
          Italic
        </button>
        <button
          data-testid="toolbar-h1"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor}
        >
          H1
        </button>
        <button
          data-testid="toolbar-h2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor}
        >
          H2
        </button>
        <button
          data-testid="toolbar-bullet-list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor}
        >
          Bullet List
        </button>
      </div>

      {/* Editor */}
      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
