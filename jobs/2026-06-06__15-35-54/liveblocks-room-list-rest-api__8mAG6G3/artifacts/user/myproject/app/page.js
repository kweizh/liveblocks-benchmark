"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (!res.ok) {
        throw new Error(`Failed to fetch rooms: ${res.status}`);
      }
      const data = await res.json();
      setRooms(data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to create room: ${res.status}`);
      }
      // On success, refresh the list
      await fetchRooms();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Liveblocks Rooms</h1>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleCreateRoom}
          disabled={creating}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: creating ? "#ccc" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create Room"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem", padding: "1rem", backgroundColor: "#ffebee", borderRadius: "4px" }}>
          Error: {error}
        </div>
      )}

      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Room List ({rooms.length})</h2>
          {rooms.length === 0 ? (
            <p>No rooms found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rooms.map((room) => (
                <li
                  key={room.id}
                  data-testid="room-row"
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid #eaeaea",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{room.id}</span>
                  <span style={{ color: "#666", fontSize: "0.875rem" }}>
                    Created: {new Date(room.createdAt || Date.now()).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
