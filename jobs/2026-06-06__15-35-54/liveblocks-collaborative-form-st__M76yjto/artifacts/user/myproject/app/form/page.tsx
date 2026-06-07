"use client";

import React from "react";
import { LiveblocksProvider, RoomProvider, useStorage, useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";

const roomId = `harbor-form-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default"}`;
const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";

export default function FormPageContainer() {
  if (!publicApiKey) {
    return (
      <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>
        Error: NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY environment variable is not defined.
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialStorage={() => ({
          form: new LiveObject({
            name: "",
            email: "",
            message: "",
            submitted: false,
          }),
        })}
      >
        <FormPage />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function FormPage() {
  const form = useStorage((root: any) => root.form);

  const updateField = useMutation(({ storage }, key: string, value: any) => {
    const formObj = storage.get("form") as any;
    if (formObj) {
      formObj.set(key, value);
    }
  }, []);

  const submitForm = useMutation(({ storage }) => {
    const formObj = storage.get("form") as any;
    if (formObj) {
      formObj.set("submitted", true);
    }
  }, []);

  if (!form) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: "1.2rem", color: "#555" }}>Connecting to collaborative session...</div>
      </div>
    );
  }

  const { name, email, message, submitted } = form;

  return (
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f9f9f9", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "24px" }}>Collaborative Feedback Form</h1>
      
      {submitted && (
        <div 
          data-testid="submitted" 
          style={{ 
            padding: "16px", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            border: "1px solid #c3e6cb", 
            borderRadius: "4px", 
            marginBottom: "20px", 
            fontWeight: "bold", 
            textAlign: "center" 
          }}
        >
          Submitted
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label htmlFor="name" style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#555" }}>Name</label>
          <input
            id="name"
            type="text"
            data-testid="field-name"
            value={name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={submitted}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: submitted ? "#e9ecef" : "#fff",
            }}
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#555" }}>Email</label>
          <input
            id="email"
            type="email"
            data-testid="field-email"
            value={email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={submitted}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: submitted ? "#e9ecef" : "#fff",
            }}
            placeholder="Your email address"
          />
        </div>

        <div>
          <label htmlFor="message" style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#555" }}>Message</label>
          <textarea
            id="message"
            data-testid="field-message"
            value={message || ""}
            onChange={(e) => updateField("message", e.target.value)}
            disabled={submitted}
            rows={5}
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: submitted ? "#e9ecef" : "#fff",
              resize: "vertical",
            }}
            placeholder="Your message"
          />
        </div>

        <button
          type="submit"
          data-testid="submit"
          disabled={submitted}
          style={{
            padding: "12px",
            backgroundColor: submitted ? "#6c757d" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: submitted ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          Submit
        </button>
      </form>
    </main>
  );
}
