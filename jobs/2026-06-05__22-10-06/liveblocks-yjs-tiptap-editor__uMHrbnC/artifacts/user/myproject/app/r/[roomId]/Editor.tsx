"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf, useOthers } from "@liveblocks/react/suspense";
import { useEffect, useState } from "react";

export default function Editor() {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<any>();

  // Get user info from Liveblocks authentication
  const me = useSelf();
  const others = useOthers();

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc.destroy();
      yProvider.destroy();
    };
  }, [room]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The Collaboration extension comes with its own history handling
        history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: me.info,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
    // Only initialize editor when doc and provider are ready
    immediateRender: false,
  }, [doc, provider]);

  if (!editor || !doc || !provider) {
    return null;
  }

  return (
    <main>
      <h1>Collaborative Editor</h1>

      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          data-testid="toolbar-bold"
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          data-testid="toolbar-italic"
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-testid="toolbar-h1"
          className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-testid="toolbar-h2"
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-testid="toolbar-bullet-list"
          className={editor.isActive("bulletList") ? "is-active" : ""}
        >
          Bullet List
        </button>
      </div>

      <div className="connected-users-container">
        <div className="connected-users">
          <div className="connected-user">
            {me.info.name} (You)
          </div>
          {others.map((other) => (
            <div key={other.connectionId} className="connected-user">
              {other.info.name}
            </div>
          ))}
        </div>
        <div data-testid="connected-count">
          {others.length + 1} connected
        </div>
      </div>

      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
