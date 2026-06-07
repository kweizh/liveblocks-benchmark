"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

function CollaborativeForm() {
  const name = useStorage((root) => root.form.name);
  const email = useStorage((root) => root.form.email);
  const message = useStorage((root) => root.form.message);
  const lastUpdate = useStorage((root) => root.form.lastUpdate);

  const updateField = useMutation(({ storage }, field: "name" | "email" | "message", value: string) => {
    const form = storage.get("form");
    form.set(field, value);
    form.set("lastUpdate", new Date().toISOString());
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 480 }}>
      <h1>Collaborative Form</h1>

      <label style={{ display: "block", marginTop: 12 }}>
        Name
        <input
          id="form-name"
          value={name}
          onChange={(e) => updateField("name", e.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Email
        <input
          id="form-email"
          value={email}
          onChange={(e) => updateField("email", e.target.value)}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Message
        <textarea
          id="form-message"
          value={message}
          onChange={(e) => updateField("message", e.target.value)}
          rows={4}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Last update: <span id="form-last-update">{lastUpdate}</span>
      </p>
    </main>
  );
}

export default function Page() {
  const roomId = `form-storage-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialStorage={{
          form: new LiveObject({ name: "", email: "", message: "", lastUpdate: "" })
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          <CollaborativeForm />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
