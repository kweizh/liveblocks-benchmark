"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf, useOthers } from "@liveblocks/react/suspense";

interface TiptapEditorProps {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
}

function TiptapEditor({ doc, provider }: TiptapEditorProps) {
  const userInfo = useSelf((me) => me.info);
  const others = useOthers();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable StarterKit's built-in history as Collaboration handles it
        history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userInfo?.name || "Anonymous",
          color: userInfo?.color || "#999",
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  const allUsers: { id: string; name: string; color: string }[] = [];
  if (userInfo) {
    allUsers.push({ id: "self", name: userInfo.name, color: userInfo.color });
  }
  others.forEach((other) => {
    if (other.info) {
      allUsers.push({
        id: other.connectionId.toString(),
        name: other.info.name,
        color: other.info.color,
      });
    }
  });

  return (
    <main>
      <h1>Collaborative Editor</h1>

      {/* Connected Users Indicator */}
      <div className="connected-users">
        {allUsers.map((user) => (
          <span
            key={user.id}
            className="connected-user"
            style={{ borderLeft: `3px solid ${user.color}`, paddingLeft: "6px" }}
          >
            {user.name}
          </span>
        ))}
        <span data-testid="connected-count">{allUsers.length} connected</span>
      </div>

      {/* Formatting Toolbar */}
      <div className="toolbar">
        <button
          data-testid="toolbar-bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          style={{ fontWeight: editor?.isActive("bold") ? "bold" : "normal" }}
        >
          Bold
        </button>
        <button
          data-testid="toolbar-italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          style={{ fontStyle: editor?.isActive("italic") ? "italic" : "normal" }}
        >
          Italic
        </button>
        <button
          data-testid="toolbar-h1"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{ textDecoration: editor?.isActive("heading", { level: 1 }) ? "underline" : "none" }}
        >
          H1
        </button>
        <button
          data-testid="toolbar-h2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{ textDecoration: editor?.isActive("heading", { level: 2 }) ? "underline" : "none" }}
        >
          H2
        </button>
        <button
          data-testid="toolbar-bullet-list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          style={{ textDecoration: editor?.isActive("bulletList") ? "underline" : "none" }}
        >
          Bullet List
        </button>
      </div>

      {/* Editor Container */}
      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}

export default function Editor() {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

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

  if (!doc || !provider) {
    return <div>Loading editor…</div>;
  }

  return <TiptapEditor doc={doc} provider={provider} />;
}
