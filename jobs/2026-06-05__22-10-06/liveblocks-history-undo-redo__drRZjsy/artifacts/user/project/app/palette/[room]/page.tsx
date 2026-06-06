"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useStorage, useUndo, useRedo, useCanUndo, useCanRedo, useHistory } from "@liveblocks/react/suspense";
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

  const dragEditFirst = useMutation(({ storage }) => {
    const p = storage.get("palette");
    if (p.length === 0) return;

    history.pause();
    p.set(0, "purple");
    p.set(0, "orange");
    p.set(0, "teal");
    history.resume();
  }, [history]);

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

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          data-testid="undo-btn"
          onClick={() => undo()}
          disabled={!canUndo}
        >
          Undo (Ctrl+Z)
        </button>
        <button
          data-testid="redo-btn"
          onClick={() => redo()}
          disabled={!canRedo}
        >
          Redo (Ctrl+Y)
        </button>
        <button
          data-testid="drag-edit"
          onClick={() => dragEditFirst()}
          disabled={palette.length === 0}
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
