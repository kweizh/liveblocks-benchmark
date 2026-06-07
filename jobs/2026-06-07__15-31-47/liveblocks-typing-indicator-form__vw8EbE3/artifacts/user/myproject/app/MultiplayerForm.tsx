"use client";

import { ClientSideSuspense } from "@liveblocks/react";
import { useStorage, useMutation, useOthers, useUpdateMyPresence } from "../liveblocks.config";

type FieldId = "name" | "email" | "bio";

function MultiplayerFormInner() {
  const form = useStorage((root) => root.form);
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const updateField = useMutation(
    ({ storage }, field: FieldId, value: string) => {
      storage.get("form").set(field, value);
    },
    []
  );

  // Compute which OTHER users are typing in each field
  const othersTypingInField = (fieldId: FieldId) =>
    others.filter((other) => other.presence.typing === fieldId);

  const handleFocus = (fieldId: FieldId) => {
    updateMyPresence({ typing: fieldId });
  };

  const handleBlur = () => {
    updateMyPresence({ typing: null });
  };

  const handleChange = (fieldId: FieldId, value: string) => {
    updateField(fieldId, value);
  };

  if (form === null) {
    return <p>Loading form...</p>;
  }

  return (
    <main>
      <h1>Multiplayer Form</h1>
      <p>Collaborate with other users in real time.</p>

      {/* Name field */}
      <div style={{ marginTop: 24 }}>
        {othersTypingInField("name").length > 0 && (
          <div
            data-testid="typing-indicator-name"
            style={{ fontSize: 13, color: "#6366f1", marginBottom: 4, minHeight: 20 }}
          >
            {othersTypingInField("name")
              .map((other) => other.presence.info.name)
              .join(", ")}{" "}
            {othersTypingInField("name").length === 1 ? "is" : "are"} typing in Name…
          </div>
        )}
        <label htmlFor="name">Name</label>
        <div style={{ position: "relative" }}>
          <input
            id="name"
            data-testid="input-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onFocus={() => handleFocus("name")}
            onBlur={handleBlur}
            style={{ display: "block", width: "100%", padding: 8 }}
          />
          {othersTypingInField("name").length > 0 && (
            <div
              data-testid="lock-overlay-name"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(200, 200, 200, 0.45)",
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Email field */}
      <div style={{ marginTop: 16 }}>
        {othersTypingInField("email").length > 0 && (
          <div
            data-testid="typing-indicator-email"
            style={{ fontSize: 13, color: "#6366f1", marginBottom: 4, minHeight: 20 }}
          >
            {othersTypingInField("email")
              .map((other) => other.presence.info.name)
              .join(", ")}{" "}
            {othersTypingInField("email").length === 1 ? "is" : "are"} typing in Email…
          </div>
        )}
        <label htmlFor="email">Email</label>
        <div style={{ position: "relative" }}>
          <input
            id="email"
            data-testid="input-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onFocus={() => handleFocus("email")}
            onBlur={handleBlur}
            style={{ display: "block", width: "100%", padding: 8 }}
          />
          {othersTypingInField("email").length > 0 && (
            <div
              data-testid="lock-overlay-email"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(200, 200, 200, 0.45)",
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Bio field */}
      <div style={{ marginTop: 16 }}>
        {othersTypingInField("bio").length > 0 && (
          <div
            data-testid="typing-indicator-bio"
            style={{ fontSize: 13, color: "#6366f1", marginBottom: 4, minHeight: 20 }}
          >
            {othersTypingInField("bio")
              .map((other) => other.presence.info.name)
              .join(", ")}{" "}
            {othersTypingInField("bio").length === 1 ? "is" : "are"} typing in Bio…
          </div>
        )}
        <label htmlFor="bio">Bio</label>
        <div style={{ position: "relative" }}>
          <textarea
            id="bio"
            data-testid="input-bio"
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            onFocus={() => handleFocus("bio")}
            onBlur={handleBlur}
            rows={4}
            style={{ display: "block", width: "100%", padding: 8 }}
          />
          {othersTypingInField("bio").length > 0 && (
            <div
              data-testid="lock-overlay-bio"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(200, 200, 200, 0.45)",
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export function MultiplayerForm() {
  return (
    <ClientSideSuspense fallback={<p>Connecting to room…</p>}>
      <MultiplayerFormInner />
    </ClientSideSuspense>
  );
}
