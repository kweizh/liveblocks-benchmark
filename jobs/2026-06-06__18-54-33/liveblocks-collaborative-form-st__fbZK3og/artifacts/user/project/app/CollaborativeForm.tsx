"use client";

import "../liveblocks.config";
import { useStorage, useMutation } from "@liveblocks/react/suspense";

export function CollaborativeForm() {
  const name = useStorage((root) => root.form.name);
  const email = useStorage((root) => root.form.email);
  const message = useStorage((root) => root.form.message);
  const lastUpdate = useStorage((root) => root.form.lastUpdate);

  const updateField = useMutation(
    (
      { storage },
      field: "name" | "email" | "message",
      value: string
    ) => {
      storage.get("form").set(field, value);
      storage.get("form").set("lastUpdate", new Date().toISOString());
    },
    []
  );

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 480 }}>
      <h1>Collaborative Form</h1>

      <label style={{ display: "block", marginTop: 12 }}>
        Name
        <input
          id="form-name"
          value={name ?? ""}
          onChange={(e) => updateField("name", e.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Email
        <input
          id="form-email"
          value={email ?? ""}
          onChange={(e) => updateField("email", e.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Message
        <textarea
          id="form-message"
          value={message ?? ""}
          onChange={(e) => updateField("message", e.target.value)}
          rows={4}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Last update: <span id="form-last-update">{lastUpdate ?? ""}</span>
      </p>
    </main>
  );
}
