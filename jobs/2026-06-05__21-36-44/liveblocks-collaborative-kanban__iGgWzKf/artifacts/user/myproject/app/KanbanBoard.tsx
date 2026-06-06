"use client";

import { useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { LiveObject } from "@liveblocks/client";
import { useStorage, useMutation } from "../liveblocks.config";

// ─── Types (plain JS shapes for read) ────────────────────────────────────────

interface CardData {
  id: string;
  title: string;
  description: string;
  assignee: string;
}

interface ColumnData {
  id: string;
  title: string;
  cardIds: readonly string[];
}

// ─── Card Component ───────────────────────────────────────────────────────────

function KanbanCard({
  card,
  columnId,
  onDelete,
  onUpdateTitle,
  onDragStart,
}: {
  card: CardData;
  columnId: string;
  onDelete: (cardId: string, columnId: string) => void;
  onUpdateTitle: (cardId: string, newTitle: string) => void;
  onDragStart: (e: React.DragEvent, cardId: string, fromColumnId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(card.title);

  const saveTitle = useCallback(() => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== card.title) {
      onUpdateTitle(card.id, trimmed);
    } else {
      setDraftTitle(card.title);
    }
    setEditing(false);
  }, [card.id, card.title, draftTitle, onUpdateTitle]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id, columnId)}
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 8,
        cursor: "grab",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        position: "relative",
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle();
            if (e.key === "Escape") {
              setDraftTitle(card.title);
              setEditing(false);
            }
          }}
          style={{
            width: "100%",
            border: "1px solid #aaa",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      ) : (
        <span
          onClick={() => {
            setDraftTitle(card.title);
            setEditing(true);
          }}
          style={{
            display: "block",
            fontSize: 14,
            cursor: "text",
            wordBreak: "break-word",
            paddingRight: 24,
          }}
          title="Click to edit"
        >
          {card.title}
        </span>
      )}
      <button
        onClick={() => onDelete(card.id, columnId)}
        title="Delete card"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          color: "#999",
          lineHeight: 1,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Column Component ─────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  cards,
  onAddCard,
  onDeleteCard,
  onUpdateCardTitle,
  onDragStart,
  onDrop,
}: {
  column: ColumnData;
  cards: Map<string, CardData>;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string, columnId: string) => void;
  onUpdateCardTitle: (cardId: string, newTitle: string) => void;
  onDragStart: (e: React.DragEvent, cardId: string, fromColumnId: string) => void;
  onDrop: (e: React.DragEvent, toColumnId: string) => void;
}) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleAdd = useCallback(() => {
    const trimmed = newCardTitle.trim();
    if (!trimmed) return;
    onAddCard(column.id, trimmed);
    setNewCardTitle("");
  }, [column.id, newCardTitle, onAddCard]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, column.id);
      }}
      style={{
        border: dragOver ? "2px solid #4a90e2" : "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        minHeight: 240,
        background: dragOver ? "#f0f7ff" : "#fafafa",
        transition: "background 0.15s, border 0.15s",
        display: "flex",
        flexDirection: "column",
      }}
      data-column-title={column.title}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
        {column.title}
      </h2>

      <div style={{ flex: 1 }}>
        {column.cardIds.length === 0 && (
          <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 8px" }}>
            No cards yet.
          </p>
        )}
        {column.cardIds.map((cardId) => {
          const card = cards.get(cardId);
          if (!card) return null;
          return (
            <KanbanCard
              key={cardId}
              card={card}
              columnId={column.id}
              onDelete={onDeleteCard}
              onUpdateTitle={onUpdateCardTitle}
              onDragStart={onDragStart}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="New card title…"
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: 13,
            boxSizing: "border-box",
            marginBottom: 6,
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newCardTitle.trim()}
          style={{
            width: "100%",
            padding: "6px 0",
            background: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: newCardTitle.trim() ? "pointer" : "not-allowed",
            fontSize: 13,
            opacity: newCardTitle.trim() ? 1 : 0.5,
          }}
        >
          + Add Card
        </button>
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
  // Read columns and cards from Liveblocks storage
  const columns = useStorage((root) =>
    root.columns.map((col) => ({
      id: col.id,
      title: col.title,
      cardIds: col.cardIds,
    }))
  );

  const cards = useStorage((root) => {
    const map = new Map<string, CardData>();
    for (const [id, card] of root.cards.entries()) {
      map.set(id, {
        id: card.id,
        title: card.title,
        description: card.description,
        assignee: card.assignee,
      });
    }
    return map;
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addCard = useMutation(
    ({ storage }, columnId: string, title: string) => {
      const id = nanoid();
      const card = new LiveObject({
        id,
        title,
        description: "",
        assignee: "",
      });
      storage.get("cards").set(id, card);

      const columns = storage.get("columns");
      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i);
        if (col && col.get("id") === columnId) {
          col.get("cardIds").push(id);
          break;
        }
      }
    },
    []
  );

  const deleteCard = useMutation(
    ({ storage }, cardId: string, columnId: string) => {
      storage.get("cards").delete(cardId);

      const columns = storage.get("columns");
      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i);
        if (col && col.get("id") === columnId) {
          const cardIds = col.get("cardIds");
          for (let j = 0; j < cardIds.length; j++) {
            if (cardIds.get(j) === cardId) {
              cardIds.delete(j);
              break;
            }
          }
          break;
        }
      }
    },
    []
  );

  const updateCardTitle = useMutation(
    ({ storage }, cardId: string, newTitle: string) => {
      const card = storage.get("cards").get(cardId);
      if (card) {
        card.set("title", newTitle);
      }
    },
    []
  );

  // Single useMutation for the drag-and-drop move: batches source removal +
  // target insertion into one Liveblocks transaction.
  const moveCard = useMutation(
    (
      { storage },
      cardId: string,
      fromColumnId: string,
      toColumnId: string
    ) => {
      if (fromColumnId === toColumnId) return;

      const columns = storage.get("columns");

      // Find source and target column LiveObjects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sourceCardIds: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let targetCardIds: any = null;

      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i);
        if (!col) continue;
        if (col.get("id") === fromColumnId) sourceCardIds = col.get("cardIds");
        if (col.get("id") === toColumnId) targetCardIds = col.get("cardIds");
      }

      if (!sourceCardIds || !targetCardIds) return;

      // Remove from source column
      for (let j = 0; j < sourceCardIds.length; j++) {
        if (sourceCardIds.get(j) === cardId) {
          sourceCardIds.delete(j);
          break;
        }
      }

      // Insert into target column
      targetCardIds.push(cardId);
    },
    []
  );

  // ── Drag state ─────────────────────────────────────────────────────────────

  const [dragState, setDragState] = useState<{
    cardId: string;
    fromColumnId: string;
  } | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, cardId: string, fromColumnId: string) => {
      e.dataTransfer.effectAllowed = "move";
      setDragState({ cardId, fromColumnId });
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, toColumnId: string) => {
      e.preventDefault();
      if (!dragState) return;
      moveCard(dragState.cardId, dragState.fromColumnId, toColumnId);
      setDragState(null);
    },
    [dragState, moveCard]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!columns || !cards) {
    return <p style={{ padding: 24 }}>Loading…</p>;
  }

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 16,
        marginTop: 24,
      }}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={cards}
          onAddCard={addCard}
          onDeleteCard={deleteCard}
          onUpdateCardTitle={updateCardTitle}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </section>
  );
}
