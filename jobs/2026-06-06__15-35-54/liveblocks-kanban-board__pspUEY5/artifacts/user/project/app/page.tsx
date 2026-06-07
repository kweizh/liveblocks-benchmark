"use client";

import { useState } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

type Card = {
  id: string;
  title: string;
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

function Board() {
  const todoCards = useStorage((root: any) => root.columns?.todo as Card[] | undefined);
  const inProgressCards = useStorage((root: any) => root.columns?.inProgress as Card[] | undefined);
  const doneCards = useStorage((root: any) => root.columns?.done as Card[] | undefined);

  const [inputValues, setInputValues] = useState({
    todo: "",
    inProgress: "",
    done: "",
  });

  const addCard = useMutation(({ storage }, columnName: "todo" | "inProgress" | "done", title: string) => {
    const columns = storage.get("columns") as any;
    if (!columns) return;
    const column = columns.get(columnName) as any;
    if (!column) return;
    column.push(new LiveObject({ id: generateId(), title }));
  }, []);

  const moveCard = useMutation(({ storage }, fromColumn: "todo" | "inProgress", toColumn: "inProgress" | "done", cardId: string) => {
    const columns = storage.get("columns") as any;
    if (!columns) return;
    const sourceList = columns.get(fromColumn) as any;
    const destList = columns.get(toColumn) as any;
    if (!sourceList || !destList) return;

    const index = sourceList.findIndex((cardObject: any) => cardObject.get("id") === cardId);
    if (index !== -1) {
      const cardObject = sourceList.get(index);
      if (cardObject) {
        sourceList.delete(index);
        destList.push(new LiveObject({
          id: cardObject.get("id"),
          title: cardObject.get("title")
        }));
      }
    }
  }, []);

  const handleInputChange = (column: "todo" | "inProgress" | "done", val: string) => {
    setInputValues((prev) => ({ ...prev, [column]: val }));
  };

  const columnsData = [
    { key: "todo" as const, title: "Todo", cards: todoCards },
    { key: "inProgress" as const, title: "In Progress", cards: inProgressCards },
    { key: "done" as const, title: "Done", cards: doneCards },
  ];

  return (
    <div style={{ padding: "24px", fontFamily: "system-ui, sans-serif", backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px", textAlign: "center", color: "#1f2937" }}>
        Collaborative Kanban Board
      </h1>
      <div style={{ display: "flex", gap: "24px", justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
        {columnsData.map((col) => (
          <div
            key={col.key}
            data-testid="column"
            data-column={col.key}
            style={{
              flex: "1",
              minWidth: "300px",
              maxWidth: "400px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px", margin: "0" }}>
              {col.title} ({col.cards?.length || 0})
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "200px" }}>
              {col.cards && col.cards.map((card) => (
                <div
                  key={card.id}
                  data-testid="card"
                  data-card-title={card.title}
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <span style={{ fontWeight: "500", color: "#1f2937", wordBreak: "break-word", marginRight: "8px" }}>
                    {card.title}
                  </span>
                  {col.key !== "done" && (
                    <button
                      data-testid="move-btn"
                      onClick={() => {
                        if (col.key === "todo") {
                          moveCard("todo", "inProgress", card.id);
                        } else if (col.key === "inProgress") {
                          moveCard("inProgress", "done", card.id);
                        }
                      }}
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
                    >
                      Move &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "auto", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
              <input
                type="text"
                data-testid="new-card-input"
                value={inputValues[col.key]}
                onChange={(e) => handleInputChange(col.key, e.target.value)}
                placeholder="New card title..."
                style={{
                  flex: "1",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <button
                data-testid="add-card-btn"
                onClick={() => {
                  const title = inputValues[col.key].trim();
                  if (title) {
                    addCard(col.key, title);
                    handleInputChange(col.key, "");
                  }
                }}
                style={{
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default-room";
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_prod_placeholder";

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialStorage={{
          columns: new LiveObject({
            todo: new LiveList<LiveObject<Card>>([]),
            inProgress: new LiveList<LiveObject<Card>>([]),
            done: new LiveList<LiveObject<Card>>([]),
          }),
        }}
      >
        <ClientSideSuspense fallback={
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#4b5563" }}>Loading collaborative board...</div>
          </div>
        }>
          <Board />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
