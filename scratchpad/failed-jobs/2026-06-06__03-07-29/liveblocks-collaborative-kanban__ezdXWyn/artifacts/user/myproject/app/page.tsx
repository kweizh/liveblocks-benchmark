"use client";

import { useCallback, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { LiveObject } from "@liveblocks/client";
import {
  RoomProvider,
  useStorage,
  useMutation,
  initialStorage,
} from "@/liveblocks.config";

// Generate unique IDs
let idCounter = 0;
function generateId() {
  return `card-${Date.now()}-${++idCounter}`;
}

// ─── Drag Item Type ───────────────────────────────────────────────
const CARD_DRAG_TYPE = "CARD";

interface CardDragItem {
  cardId: string;
  sourceColumnId: string;
  sourceIndex: number;
}

// ─── Card Component ───────────────────────────────────────────────
function CardItem({
  cardId,
  columnId,
  index,
}: {
  cardId: string;
  columnId: string;
  index: number;
}) {
  const cards = useStorage((root) => root.cards);
  const card = cards?.get(cardId);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const deleteCard = useMutation(
    ({ storage }, cardId: string, columnId: string) => {
      const columns = storage.get("columns");
      const cards = storage.get("cards");

      // Remove card id from the column's cardIds
      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i)!;
        if (col.get("id") === columnId) {
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

      // Delete the card from the cards map
      cards.delete(cardId);
    },
    []
  );

  const updateCardTitle = useMutation(
    ({ storage }, cardId: string, newTitle: string) => {
      const cards = storage.get("cards");
      const card = cards.get(cardId);
      if (card) {
        card.set("title", newTitle);
      }
    },
    []
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: CARD_DRAG_TYPE,
      item: { cardId, sourceColumnId: columnId, sourceIndex: index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [cardId, columnId, index]
  );

  const handleStartEdit = useCallback(() => {
    if (card) {
      setEditValue(card.title);
      setEditing(true);
    }
  }, [card]);

  const handleSaveEdit = useCallback(() => {
    if (editValue.trim()) {
      updateCardTitle(cardId, editValue.trim());
    }
    setEditing(false);
  }, [editValue, cardId, updateCardTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [handleSaveEdit]
  );

  if (!card) return null;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      style={{
        padding: "8px 12px",
        margin: "4px 0",
        backgroundColor: "#fff",
        borderRadius: 4,
        border: "1px solid #ccc",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
      data-card-id={cardId}
    >
      {editing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: "1px solid #0070f3",
            borderRadius: 3,
            padding: "2px 4px",
            fontSize: 14,
          }}
          autoFocus
        />
      ) : (
        <span
          onClick={handleStartEdit}
          style={{
            flex: 1,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {card.title}
        </span>
      )}
      <button
        onClick={() => deleteCard(cardId, columnId)}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: "0 4px",
        }}
        title="Delete card"
      >
        ×
      </button>
    </div>
  );
}

// ─── Column Component ──────────────────────────────────────────────
function KanbanColumn({
  columnId,
  title,
}: {
  columnId: string;
  title: string;
}) {
  const columns = useStorage((root) => root.columns);
  const column = columns?.find((col) => col.id === columnId);
  const cardIds = column?.cardIds ?? [];
  const [newCardTitle, setNewCardTitle] = useState("");

  const addCard = useMutation(
    ({ storage }, columnId: string, title: string) => {
      const columns = storage.get("columns");
      const cards = storage.get("cards");

      const cardId = generateId();

      // Add the card to the cards map
      cards.set(
        cardId,
        new LiveObject({
          id: cardId,
          title,
          description: "",
          assignee: "",
        })
      );

      // Add the card id to the column's cardIds
      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i)!;
        if (col.get("id") === columnId) {
          col.get("cardIds").push(cardId);
          break;
        }
      }
    },
    []
  );

  // The drag-and-drop move mutation: MUST be a single useMutation that
  // batches both the source-column removal and the target-column insertion.
  const moveCard = useMutation(
    (
      { storage },
      cardId: string,
      sourceColumnId: string,
      targetColumnId: string,
      targetIndex?: number
    ) => {
      const columns = storage.get("columns");

      let sourceColIndex = -1;
      let targetColIndex = -1;
      let sourceCardIndex = -1;

      for (let i = 0; i < columns.length; i++) {
        const col = columns.get(i)!;
        const id = col.get("id");
        if (id === sourceColumnId) {
          sourceColIndex = i;
          const cardIds = col.get("cardIds");
          for (let j = 0; j < cardIds.length; j++) {
            if (cardIds.get(j) === cardId) {
              sourceCardIndex = j;
              break;
            }
          }
        }
        if (id === targetColumnId) {
          targetColIndex = i;
        }
      }

      if (
        sourceColIndex === -1 ||
        targetColIndex === -1 ||
        sourceCardIndex === -1
      )
        return;

      const sourceCol = columns.get(sourceColIndex)!;
      const targetCol = columns.get(targetColIndex)!;

      // Remove from source column
      sourceCol.get("cardIds").delete(sourceCardIndex);

      // Insert into target column
      const targetCardIds = targetCol.get("cardIds");
      const insertAt =
        targetIndex !== undefined && targetIndex < targetCardIds.length
          ? targetIndex
          : targetCardIds.length;
      targetCardIds.insert(cardId, insertAt);
    },
    []
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: CARD_DRAG_TYPE,
      drop: (item: CardDragItem) => {
        if (
          item.sourceColumnId !== columnId ||
          item.sourceIndex !== cardIds.length
        ) {
          moveCard(item.cardId, item.sourceColumnId, columnId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [columnId, cardIds.length, moveCard]
  );

  const handleAddCard = useCallback(() => {
    const trimmed = newCardTitle.trim();
    if (trimmed) {
      addCard(columnId, trimmed);
      setNewCardTitle("");
    }
  }, [newCardTitle, columnId, addCard]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAddCard();
      }
    },
    [handleAddCard]
  );

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        minHeight: 240,
        backgroundColor: isOver ? "#f0f7ff" : "#f9f9f9",
        display: "flex",
        flexDirection: "column",
      }}
      data-column-id={columnId}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h2>
      <div style={{ flex: 1, minHeight: 60 }}>
        {cardIds.length === 0 && (
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
            No cards yet.
          </p>
        )}
        {cardIds.map((cardId, index) => (
          <CardItem
            key={cardId}
            cardId={cardId}
            columnId={columnId}
            index={index}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        <input
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New card title…"
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
        <button
          onClick={handleAddCard}
          style={{
            padding: "4px 12px",
            borderRadius: 4,
            border: "1px solid #ccc",
            background: "#0070f3",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Inner Board (inside RoomProvider) ────────────────────────────
function KanbanBoard() {
  const columns = useStorage((root) => root.columns);

  if (!columns) {
    return <div>Loading…</div>;
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
      {columns.map((col) => (
        <KanbanColumn key={col.id} columnId={col.id} title={col.title} />
      ))}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function KanbanPage() {
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID
    ? `kanban-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`
    : process.env.ZEALT_RUN_ID
      ? `kanban-${process.env.ZEALT_RUN_ID}`
      : "kanban-local";

  return (
    <RoomProvider id={roomId} initialStorage={initialStorage}>
      <DndProvider backend={HTML5Backend}>
        <main style={{ padding: 24 }}>
          <h1>Collaborative Kanban</h1>
          <KanbanBoard />
        </main>
      </DndProvider>
    </RoomProvider>
  );
}