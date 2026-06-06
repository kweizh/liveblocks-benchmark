"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useSelf, useOthers, useRoom } from "@liveblocks/react/suspense";

export default function Editor() {
  const room = useRoom();
  const self = useSelf();
  const others = useOthers();

  const [yDoc] = useState(() => new Y.Doc());
  const [provider] = useState(() => new LiveblocksYjsProvider(room, yDoc));

  useEffect(() => {
    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [provider, yDoc]);

  const name = self.info?.name ?? "Anonymous";
  const color = self.info?.color ?? "#ccc";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: yDoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: { name, color },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  // Update the collaboration cursor user info when it changes
  useEffect(() => {
    provider.awareness.setLocalStateField("user", { name, color });
  }, [provider, name, color]);

  const setBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const setItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const setH1 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 1 }).run();
  }, [editor]);

  const setH2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }, [editor]);

  const setBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  // Combine self + others for connected users list
  const allUsers = [self, ...others];
  const connectedCount = allUsers.length;

  return (
    <main>
      <h1>Collaborative Editor</h1>

      <div className="connected-users">
        {allUsers.map((user) => (
          <span
            key={user.connectionId}
            className="connected-user"
            style={{ backgroundColor: user.info?.color || "#ccc" }}
          >
            {user.info?.name || "Anonymous"}
          </span>
        ))}
        <span data-testid="connected-count">{connectedCount} connected</span>
      </div>

      <div className="toolbar">
        <button data-testid="toolbar-bold" onClick={setBold}>
          <strong>B</strong>
        </button>
        <button data-testid="toolbar-italic" onClick={setItalic}>
          <em>I</em>
        </button>
        <button data-testid="toolbar-h1" onClick={setH1}>
          H1
        </button>
        <button data-testid="toolbar-h2" onClick={setH2}>
          H2
        </button>
        <button data-testid="toolbar-bullet-list" onClick={setBulletList}>
          • List
        </button>
      </div>

      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}