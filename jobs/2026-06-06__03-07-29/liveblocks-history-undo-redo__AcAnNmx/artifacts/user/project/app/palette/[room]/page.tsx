"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useMutation,
  useStorage,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useHistory,
} from "@liveblocks/react/suspense";
import { Room } from "./Room";

function PaletteEditor() {
  const palette = useStorage((root) => root.palette);
  const [draft, setDraft] = useState("");
  const [edits, setEdits] = useState<Record<number, string>>({});

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const history = useHistory();

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

  const dragEditSetColors = useMutation(({ storage }) => {
    const list = storage.get("palette");
    list.set(0, "purple");
    list.set(0, "orange");
    list.set(0, "teal");
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

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          data-testid="undo-btn"
          disabled={!canUndo}
          onClick={() => undo()}
        >
          Undo (Ctrl+Z)
        </button>
        <button
          data-testid="redo-btn"
          disabled={!canRedo}
          onClick={() => redo()}
        >
          Redo (Ctrl+Y)
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          data-testid="drag-edit"
          disabled={palette.length === 0}
          onClick={() => {
            history.pause();
            dragEditSetColors();
            history.resume();
          }}
        >
          Drag-edit first
        </button>
      </div>

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