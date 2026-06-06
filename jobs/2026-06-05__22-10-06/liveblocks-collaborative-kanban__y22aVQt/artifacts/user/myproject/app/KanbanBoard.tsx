"use client";

import React, { useState, useCallback } from "react";
import { useStorage, useMutation } from "../liveblocks.config";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function KanbanBoard() {
  const columns = useStorage((root) => root.columns);

  return (
    <DndProvider backend={HTML5Backend}>
      <main style={{ padding: 24 }}>
        <h1>Collaborative Kanban</h1>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {columns?.map((column, index) => (
            <Column key={column.id} column={column} index={index} />
          ))}
        </section>
      </main>
    </DndProvider>
  );
}

function Column({ column, index }: { column: any; index: number }) {
  const addCard = useMutation(({ storage }, columnId: string, title: string) => {
    const cardId = nanoid();
    const newCard = new LiveObject({
      id: cardId,
      title,
      description: "",
      assignee: "",
    });
    storage.get("cards").set(cardId, newCard);
    const columns = storage.get("columns");
    const col = columns.get(index);
    if (col) {
      col.get("cardIds").push(cardId);
    }
  }, [index]);

  const moveCard = useMutation(({ storage }, cardId: string, fromColumnIndex: number, toColumnIndex: number) => {
    const columns = storage.get("columns");
    const fromCol = columns.get(fromColumnIndex);
    const toCol = columns.get(toColumnIndex);

    if (fromCol && toCol) {
      const fromCardIds = fromCol.get("cardIds");
      const cardIndex = fromCardIds.indexOf(cardId);
      if (cardIndex !== -1) {
        fromCardIds.delete(cardIndex);
        toCol.get("cardIds").push(cardId);
      }
    }
  }, []);

  const [, drop] = useDrop({
    accept: "CARD",
    drop: (item: { id: string; columnIndex: number }) => {
      if (item.columnIndex !== index) {
        moveCard(item.id, item.columnIndex, index);
      }
    },
  });

  const [newCardTitle, setNewCardTitle] = useState("");

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCard(column.id, newCardTitle.trim());
      setNewCardTitle("");
    }
  };

  return (
    <div
      ref={drop as any}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        minHeight: 400,
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{column.title}</h2>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="New card title"
          style={{ padding: 4, width: "calc(100% - 60px)", marginRight: 4 }}
          onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
        />
        <button onClick={handleAddCard} style={{ padding: "4px 8px" }}>Add</button>
      </div>
      <div>
        {column.cardIds.map((cardId: string) => (
          <Card key={cardId} cardId={cardId} columnIndex={index} />
        ))}
      </div>
    </div>
  );
}

function Card({ cardId, columnIndex }: { cardId: string; columnIndex: number }) {
  const card = useStorage((root) => root.cards.get(cardId));
  
  const updateCardTitle = useMutation(({ storage }, newTitle: string) => {
    const card = storage.get("cards").get(cardId);
    if (card) {
      card.set("title", newTitle);
    }
  }, [cardId]);

  const deleteCard = useMutation(({ storage }) => {
    storage.get("cards").delete(cardId);
    const columns = storage.get("columns");
    columns.forEach((col) => {
      const cardIds = col.get("cardIds");
      const index = cardIds.indexOf(cardId);
      if (index !== -1) {
        cardIds.delete(index);
      }
    });
  }, [cardId]);

  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { id: cardId, columnIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card?.title || "");

  const handleSave = () => {
    updateCardTitle(editTitle);
    setIsEditing(false);
  };

  if (!card) return null;

  return (
    <div
      ref={drag as any}
      style={{
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 8,
        marginBottom: 8,
        backgroundColor: "white",
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          style={{ width: "100%", marginBottom: 4 }}
        />
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <h3
            onClick={() => {
              setEditTitle(card.title);
              setIsEditing(true);
            }}
            style={{ margin: 0, fontSize: 16, cursor: "pointer", flex: 1 }}
          >
            {card.title}
          </h3>
          <button
            onClick={() => deleteCard()}
            style={{
              marginLeft: 8,
              padding: "0 4px",
              fontSize: 12,
              color: "red",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        </div>
      )}
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>{cardId}</p>
    </div>
  );
}
