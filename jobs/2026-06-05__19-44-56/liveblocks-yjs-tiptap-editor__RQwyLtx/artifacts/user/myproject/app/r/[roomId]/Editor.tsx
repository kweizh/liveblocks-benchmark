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
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<LiveblocksYjsProvider>();

  // Set up Liveblocks Yjs provider
  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    
    setDoc(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc?.destroy();
      yProvider?.destroy();
    };
  }, [room]);

  if (!doc || !provider) {
    return null;
  }

  return <TiptapEditor doc={doc} provider={provider} />;
}

function TiptapEditor({ doc, provider }: { doc: Y.Doc, provider: LiveblocksYjsProvider }) {
  const currentUser = useSelf();
  const others = useOthers();
  const users = [currentUser, ...others];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaboration extension comes with its own history
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: currentUser.info,
      }),
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
      
      <div>
        <div data-testid="connected-count">{users.length} connected</div>
        {users.map((user) => (
          <div key={user.connectionId} className="connected-user">
            {user.info?.name}
          </div>
        ))}
      </div>

      {editor && (
        <div className="toolbar">
          <button
            data-testid="toolbar-bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
          >
            Bold
          </button>
          <button
            data-testid="toolbar-italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
          >
            Italic
          </button>
          <button
            data-testid="toolbar-h1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
          >
            H1
          </button>
          <button
            data-testid="toolbar-h2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          >
            H2
          </button>
          <button
            data-testid="toolbar-bullet-list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is-active" : ""}
          >
            Bullet List
          </button>
        </div>
      )}

      <div data-testid="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
