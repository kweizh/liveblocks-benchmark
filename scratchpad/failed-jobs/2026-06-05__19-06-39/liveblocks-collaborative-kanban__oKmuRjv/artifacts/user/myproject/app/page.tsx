"use client";

import { useState } from "react";
import { RoomProvider, useStorage, useMutation } from "../liveblocks.config";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

// Get room suffix from environment, falling back to "local"
const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "";
const roomId = runId ? `kanban-${runId}` : "kanban-local";

export default function KanbanPage() {
  return (
    <RoomProvider
      id={roomId}
      initialStorage={() => ({
        columns: new LiveList([
          new LiveObject({
            id: "todo",
            title: "To Do",
            cardIds: new LiveList<string>([]),
          }),
          new LiveObject({
            id: "in-progress",
            title: "In Progress",
            cardIds: new LiveList<string>([]),
          }),
          new LiveObject({
            id: "done",
            title: "Done",
            cardIds: new LiveList<string>([]),
          }),
        ]),
        cards: new LiveMap<string, LiveObject<{ id: string; title: string; description: string; assignee: string }>>(),
      })}
    >
      <Board />
    </RoomProvider>
  );
}

function Board() {
  const columns = useStorage((root) => root.columns);
  const cards = useStorage((root) => root.cards);

  const addCard = useMutation(({ storage }, columnId: string, title: string) => {
    const columnsList = storage.get("columns");
    const cardsMap = storage.get("cards");

    const column = columnsList.find((col) => col.get("id") === columnId);
    if (!column) return;

    const cardId = "card-" + Math.random().toString(36).substring(2, 9);
    const newCard = new LiveObject({
      id: cardId,
      title: title,
      description: "",
      assignee: "",
    });

    cardsMap.set(cardId, newCard);
    column.get("cardIds").push(cardId);
  }, []);

  const updateCardTitle = useMutation(({ storage }, cardId: string, newTitle: string) => {
    const cardsMap = storage.get("cards");
    const card = cardsMap.get(cardId);
    if (card) {
      card.set("title", newTitle);
    }
  }, []);

  const deleteCard = useMutation(({ storage }, cardId: string, columnId: string) => {
    const columnsList = storage.get("columns");
    const cardsMap = storage.get("cards");

    const column = columnsList.find((col) => col.get("id") === columnId);
    if (column) {
      const cardIds = column.get("cardIds");
      const index = cardIds.toArray().indexOf(cardId);
      if (index !== -1) {
        cardIds.delete(index);
      }
    }

    cardsMap.delete(cardId);
  }, []);

  const moveCard = useMutation(({ storage }, cardId: string, sourceColId: string, targetColId: string, targetIndex?: number) => {
    const columnsList = storage.get("columns");
    const sourceCol = columnsList.find((col) => col.get("id") === sourceColId);
    const targetCol = columnsList.find((col) => col.get("id") === targetColId);

    if (!sourceCol || !targetCol) return;

    const sourceCardIds = sourceCol.get("cardIds");
    const targetCardIds = targetCol.get("cardIds");

    const index = sourceCardIds.toArray().indexOf(cardId);
    if (index !== -1) {
      sourceCardIds.delete(index);
      if (typeof targetIndex === "number") {
        let adjustedIndex = targetIndex;
        if (sourceColId === targetColId && index < targetIndex) {
          adjustedIndex = Math.max(0, targetIndex - 1);
        }
        targetCardIds.insert(cardId, adjustedIndex);
      } else {
        targetCardIds.push(cardId);
      }
    }
  }, []);

  if (!columns || !cards) {
    return (
      <div style={{ padding: 24, textAlign: "center", fontSize: 18, color: "#666" }}>
        Loading collaborative board...
      </div>
    );
  }

  const getCard = (cardId: string) => {
    if (typeof cards.get === "function") {
      return cards.get(cardId);
    }
    return cards[cardId];
  };

  return (
    <main style={{ padding: "24px max(16px, calc((100% - 1200px) / 2))", minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      <header style={{ marginBottom: 32, borderBottom: "1px solid #eaecef", paddingBottom: 16 }}>
        <h1 style={{ margin: "0 0 8px 0", color: "#172b4d", fontSize: 28, fontWeight: 700 }}>Collaborative Kanban Board</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: "#36b37e" }} />
          <span style={{ fontSize: 14, color: "#5e6c84", fontWeight: 500 }}>
            Liveblocks Room: <code style={{ backgroundColor: "#f4f5f7", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{roomId}</code>
          </span>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {columns.map((column) => {
          const colId = column.id;
          const colTitle = column.title;
          const colCardIds = column.cardIds || [];

          return (
            <ColumnComponent
              key={colId}
              id={colId}
              title={colTitle}
              cardIds={colCardIds}
              getCard={getCard}
              addCard={addCard}
              updateCardTitle={updateCardTitle}
              deleteCard={deleteCard}
              moveCard={moveCard}
            />
          );
        })}
      </section>
    </main>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  cardIds: readonly string[];
  getCard: (cardId: string) => any;
  addCard: (columnId: string, title: string) => void;
  updateCardTitle: (cardId: string, newTitle: string) => void;
  deleteCard: (cardId: string, columnId: string) => void;
  moveCard: (cardId: string, sourceColId: string, targetColId: string, targetIndex?: number) => void;
}

function ColumnComponent({
  id,
  title,
  cardIds,
  getCard,
  addCard,
  updateCardTitle,
  deleteCard,
  moveCard,
}: ColumnProps) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    addCard(id, newCardTitle.trim());
    setNewCardTitle("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.cardId && data.sourceColId) {
        moveCard(data.cardId, data.sourceColId, id);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  return (
    <div
      style={{
        backgroundColor: isDragOver ? "#ebecf0" : "#f4f5f7",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: isDragOver ? "2px dashed #0052cc" : "2px solid transparent",
        minHeight: 450,
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.2s, border 0.2s",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-column-title={title}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#172b4d", margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84", backgroundColor: "#dfe1e6", borderRadius: 10, padding: "2px 8px" }}>
          {cardIds.length}
        </span>
      </div>

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {cardIds.length === 0 ? (
          <p style={{ color: "#888", fontSize: 14, textAlign: "center", margin: "24px 0" }}>No cards yet.</p>
        ) : (
          cardIds.map((cardId, index) => {
            const card = getCard(cardId);
            if (!card) return null;
            return (
              <CardComponent
                key={cardId}
                card={card}
                columnId={id}
                index={index}
                updateCardTitle={updateCardTitle}
                deleteCard={deleteCard}
                moveCard={moveCard}
              />
            );
          })
        )}
      </div>

      <form onSubmit={handleAddCard} style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <input
          type="text"
          placeholder="New card title..."
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          style={{
            flexGrow: 1,
            padding: "8px 12px",
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #c1c7d0",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#0052cc")}
          onBlur={(e) => (e.target.style.borderColor = "#c1c7d0")}
        />
        <button
          type="submit"
          style={{
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#0052cc",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0065ff")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0052cc")}
        >
          Add
        </button>
      </form>
    </div>
  );
}

interface CardProps {
  card: { id: string; title: string; description: string; assignee: string };
  columnId: string;
  index: number;
  updateCardTitle: (cardId: string, newTitle: string) => void;
  deleteCard: (cardId: string, columnId: string) => void;
  moveCard: (cardId: string, sourceColId: string, targetColId: string, targetIndex?: number) => void;
}

function CardComponent({
  card,
  columnId,
  index,
  updateCardTitle,
  deleteCard,
  moveCard,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [isDragging, setIsDragging] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle.trim() !== card.title) {
      updateCardTitle(card.id, editTitle.trim());
    } else {
      setEditTitle(card.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(card.title);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: card.id, sourceColId: columnId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.cardId && data.sourceColId) {
        moveCard(data.cardId, data.sourceColId, columnId, index);
      }
    } catch (err) {
      console.error("Card drop error", err);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: "12px 14px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        border: "1px solid #dfe1e6",
        position: "relative",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseOver={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
          e.currentTarget.style.borderColor = "#c1c7d0";
        }
      }}
      onMouseOut={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
          e.currentTarget.style.borderColor = "#dfe1e6";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flexGrow: 1,
              padding: "4px 8px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 4,
              border: "2px solid #0052cc",
              outline: "none",
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            style={{
              flexGrow: 1,
              fontSize: 14,
              fontWeight: 500,
              color: "#172b4d",
              cursor: "pointer",
              userSelect: "none",
              wordBreak: "break-word",
            }}
            title="Click to edit title"
          >
            {card.title}
          </span>
        )}

        <button
          onClick={() => deleteCard(card.id, columnId)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#97a0af",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
            borderRadius: 4,
            transition: "color 0.15s, background-color 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#de350b";
            e.currentTarget.style.backgroundColor = "#ffebe6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#97a0af";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Delete card"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
