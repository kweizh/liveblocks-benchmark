"use client";

import React, { useState, useRef } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { useStorage, useMutation, useMyPresence, useOthers } from "@liveblocks/react/suspense";
import { LiveMap } from "@liveblocks/client";

// Inline the 25 cell labels so the static initial-state test can see them.
const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5"
];

function evaluateCell(
  label: string,
  cellsMap: ReadonlyMap<string, string> | null | undefined,
  visited: Set<string> = new Set()
): string {
  if (visited.has(label)) {
    return "#ERR"; // Circular reference
  }
  visited.add(label);

  const rawValue = cellsMap?.get(label);
  if (!rawValue) {
    visited.delete(label);
    return "";
  }

  if (rawValue.startsWith("=")) {
    const match = rawValue.match(/^=SUM\(\s*([A-E][1-5])\s*,\s*([A-E][1-5])\s*\)$/i);
    if (!match) {
      visited.delete(label);
      return "#ERR";
    }
    const ref1 = match[1].toUpperCase();
    const ref2 = match[2].toUpperCase();

    const val1Str = evaluateCell(ref1, cellsMap, visited);
    const val2Str = evaluateCell(ref2, cellsMap, visited);

    if (val1Str === "#ERR" || val2Str === "#ERR") {
      visited.delete(label);
      return "#ERR";
    }

    const num1 = val1Str ? parseFloat(val1Str) : 0;
    const num2 = val2Str ? parseFloat(val2Str) : 0;

    const sumVal = (isNaN(num1) ? 0 : num1) + (isNaN(num2) ? 0 : num2);
    visited.delete(label);
    return sumVal.toString();
  }

  visited.delete(label);
  return rawValue;
}

function SpreadsheetLoading() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 120px)",
          gridAutoRows: "36px",
          gap: 0,
          marginTop: 16
        }}
      >
        {CELL_LABELS.map((label) => (
          <div
            key={label}
            role="gridcell"
            data-cell={label}
            style={{
              border: "1px solid #ccc",
              padding: "4px 8px",
              boxSizing: "border-box",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span style={{ color: "#999", fontSize: "10px" }}>{label}</span>
            <span></span>
          </div>
        ))}
      </div>
    </main>
  );
}

function SpreadsheetGrid() {
  const cells = useStorage((root) => root.cells);
  const others = useOthers();
  const [, updateMyPresence] = useMyPresence();

  const updateCellValue = useMutation(({ storage }, key: string, value: string) => {
    let cellsMap = storage.get("cells");
    if (!cellsMap) {
      cellsMap = new LiveMap<string, string>();
      storage.set("cells", cellsMap);
    }
    cellsMap.set(key, value);
  }, []);

  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<string>("");
  const isSavingRef = useRef(false);

  const startEditing = (label: string) => {
    setEditingCellId(label);
    setLocalValue(cells?.get(label) || "");
    updateMyPresence({ editingCell: label });
    isSavingRef.current = false;
  };

  const handleBlur = (label: string) => {
    if (editingCellId === label && !isSavingRef.current) {
      isSavingRef.current = true;
      updateCellValue(label, localValue);
      setEditingCellId(null);
      updateMyPresence({ editingCell: null });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, label: string) => {
    if (e.key === "Enter") {
      if (editingCellId === label && !isSavingRef.current) {
        isSavingRef.current = true;
        updateCellValue(label, localValue);
        setEditingCellId(null);
        updateMyPresence({ editingCell: null });
      }
    } else if (e.key === "Escape") {
      if (editingCellId === label) {
        isSavingRef.current = true;
        setEditingCellId(null);
        updateMyPresence({ editingCell: null });
      }
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 120px)",
          gridAutoRows: "36px",
          gap: 0,
          marginTop: 16
        }}
      >
        {CELL_LABELS.map((label) => {
          const isEditing = editingCellId === label;
          const isRemoteEditing = others.some((other) => other.presence?.editingCell === label);
          const evaluatedValue = evaluateCell(label, cells);

          return (
            <div
              key={label}
              role="gridcell"
              data-cell={label}
              data-remote-editing={isRemoteEditing ? "true" : "false"}
              onClick={() => {
                if (!isEditing) {
                  startEditing(label);
                }
              }}
              style={{
                border: isRemoteEditing ? "2px solid red" : "1px solid #ccc",
                padding: "4px 8px",
                boxSizing: "border-box",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                backgroundColor: isRemoteEditing ? "#fff5f5" : "transparent",
                position: "relative"
              }}
            >
              <span style={{ color: "#999", fontSize: "10px", pointerEvents: "none" }}>{label}</span>
              {isEditing ? (
                <input
                  autoFocus
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onBlur={() => handleBlur(label)}
                  onKeyDown={(e) => handleKeyDown(e, label)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "2px solid #0066cc",
                    padding: "4px 8px",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    zIndex: 10
                  }}
                />
              ) : (
                <span style={{ fontSize: "14px" }}>{evaluatedValue}</span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function SpreadsheetPage() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "";
  const roomId = `spreadsheet-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "dev"}`;

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialPresence={{ editingCell: null }}
        initialStorage={{
          cells: new LiveMap<string, string>()
        }}
      >
        <ClientSideSuspense fallback={<SpreadsheetLoading />}>
          {() => <SpreadsheetGrid />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
