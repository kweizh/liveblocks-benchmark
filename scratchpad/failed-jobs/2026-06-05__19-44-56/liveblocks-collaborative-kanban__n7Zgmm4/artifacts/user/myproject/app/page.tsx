"use client";

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage, useMutation } from "../liveblocks.config";
import { useState } from "react";
import { ClientSideSuspense } from "@liveblocks/react";

function Card({ id, columnId }: { id: string, columnId: string }) {
  const card = useStorage((root) => root.cards.get(id));
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card?.title || "");

  const updateTitle = useMutation(({ storage }, newTitle: string) => {
    const cardObj = storage.get("cards").get(id);
    if (cardObj) {
      cardObj.update({ title: newTitle });
    }
  }, [id]);

  const deleteCard = useMutation(({ storage }) => {
    const columns = storage.get("columns");
    const col = columns.find(c => c.get("id") === columnId);
    if (col) {
      const cardIds = col.get("cardIds");
      const index = cardIds.indexOf(id);
      if (index !== -1) {
        cardIds.delete(index);
      }
    }
    storage.get("cards").delete(id);
  }, [id, columnId]);

  if (!card) return null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: id, sourceColumnId: columnId }));
      }}
      style={{
        border: "1px solid #ccc",
        padding: "8px",
        marginBottom: "8px",
        backgroundColor: "white",
        cursor: "grab",
        borderRadius: "4px"
      }}
    >
      {isEditing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            updateTitle(title);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateTitle(title);
              setIsEditing(false);
            }
          }}
          autoFocus
        />
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span onClick={() => { setIsEditing(true); setTitle(card.title); }} style={{ cursor: "text", flexGrow: 1 }}>{card.title}</span>
          <button onClick={() => deleteCard()} style={{ marginLeft: "8px" }}>X</button>
        </div>
      )}
    </div>
  );
}

function Column({ col, index }: { col: any, index: number }) {
  const [newCardTitle, setNewCardTitle] = useState("");
  
  const addCard = useMutation(({ storage }, title: string) => {
    const cardId = Math.random().toString(36).substring(2, 9);
    const newCard = new LiveObject({
      id: cardId,
      title,
      description: "",
      assignee: ""
    });
    storage.get("cards").set(cardId, newCard);
    
    const columns = storage.get("columns");
    const columnObj = columns.get(index);
    columnObj.get("cardIds").push(cardId);
  }, [index]);

  const moveCard = useMutation(({ storage }, cardId: string, sourceColumnId: string, targetIndex: number) => {
    const columns = storage.get("columns");
    
    // Find source column and remove
    let sourceColIndex = -1;
    for (let i = 0; i < columns.length; i++) {
      if (columns.get(i).get("id") === sourceColumnId) {
        sourceColIndex = i;
        break;
      }
    }
    
    if (sourceColIndex !== -1) {
      const sourceCardIds = columns.get(sourceColIndex).get("cardIds");
      const cardIndex = sourceCardIds.indexOf(cardId);
      if (cardIndex !== -1) {
        sourceCardIds.delete(cardIndex);
      }
    }
    
    // Add to target column
    columns.get(targetIndex).get("cardIds").push(cardId);
  }, [index]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (data) {
          try {
            const { cardId, sourceColumnId } = JSON.parse(data);
            if (sourceColumnId !== col.id) {
              moveCard(cardId, sourceColumnId, index);
            }
          } catch (e) {}
        }
      }}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        minHeight: 240,
        backgroundColor: "#f9f9f9"
      }}
      data-column-title={col.title}
    >
      <h2 style={{ marginTop: 0 }}>{col.title}</h2>
      
      <div style={{ marginBottom: "12px" }}>
        {col.cardIds.map((cardId: string) => (
          <Card key={cardId} id={cardId} columnId={col.id} />
        ))}
        {col.cardIds.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>No cards yet.</p>}
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        <input 
          value={newCardTitle} 
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="New card title"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCardTitle.trim()) {
              addCard(newCardTitle.trim());
              setNewCardTitle("");
            }
          }}
          style={{ width: "100%" }}
        />
        <button 
          onClick={() => {
            if (newCardTitle.trim()) {
              addCard(newCardTitle.trim());
              setNewCardTitle("");
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Board() {
  const columns = useStorage((root) => root.columns);

  if (!columns) return <div>Loading...</div>;

  return (
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
        {columns.map((col, i) => (
          <Column key={col.id} col={col} index={i} />
        ))}
      </section>
    </main>
  );
}

export default function KanbanPage() {
  const roomId = `kanban-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local"}`;
  
  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{}}
      initialStorage={{
        columns: new LiveList([
          new LiveObject({ id: "todo", title: "To Do", cardIds: new LiveList([]) }),
          new LiveObject({ id: "in-progress", title: "In Progress", cardIds: new LiveList([]) }),
          new LiveObject({ id: "done", title: "Done", cardIds: new LiveList([]) })
        ]),
        cards: new LiveMap()
      }}
    >
      <ClientSideSuspense fallback={<div>Loading...</div>}>
        {() => <Board />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
