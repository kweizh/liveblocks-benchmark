"use client";

import { useState } from "react";
import { LiveblocksProvider, RoomProvider, useBroadcastEvent, useEventListener } from "@liveblocks/react";

function ChatRoom() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [senderName] = useState(() => `User-${Math.floor(Math.random() * 10000)}`);
  
  const broadcast = useBroadcastEvent();

  useEventListener(({ event }) => {
    if (event.type === "CHAT") {
      setMessages((prev) => {
        const next = [...prev, { text: event.text, from: event.from, id: Math.random().toString() }];
        return next.slice(-50);
      });
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const messageText = inputValue.trim();

    broadcast({
      type: "CHAT",
      text: messageText,
      from: senderName,
    });

    setMessages((prev) => {
      const next = [...prev, { text: messageText, from: senderName, id: Math.random().toString() }];
      return next.slice(-50);
    });

    setInputValue("");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "20px", fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h1 style={{ textAlign: "center" }}>Liveblocks Shared Chat</h1>
      <p style={{ textAlign: "center", color: "#666" }}>Your name: <strong>{senderName}</strong></p>
      
      <div style={{ height: "400px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "4px", marginBottom: "15px", background: "#f9f9f9" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", marginTop: "150px" }}>No messages yet. Send a message to start broadcasting!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              data-testid="chat-message"
              style={{
                padding: "8px 12px",
                margin: "8px 0",
                borderRadius: "6px",
                background: msg.from === senderName ? "#e1f5fe" : "#fff",
                border: "1px solid #e0e0e0",
                alignSelf: msg.from === senderName ? "flex-end" : "flex-start",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#888", display: "block", marginBottom: "2px" }}>{msg.from}</span>
              <span style={{ fontSize: "1rem", color: "#333", wordBreak: "break-word" }}>{msg.text}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px", fontSize: "1rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: "1rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function Page() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || process.env.ZEALT_RUN_ID || "default-run-id";
  const roomId = `harbor-chat-broadcast-${runId}`;
  const apiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

  if (!apiKey) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        Error: NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY environment variable is not configured.
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={apiKey}>
      <RoomProvider id={roomId} initialPresence={{}}>
        <ChatRoom />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
