"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
} from "@liveblocks/react";
import { CELL_LABELS } from "../liveblocks.config";

// ---------- Formula evaluator ----------
const SUM_REGEX = /^=SUM\(\s*([A-E][1-5])\s*,\s*([A-E][1-5])\s*\)$/i;

function evaluateFormula(
  raw: string,
  getCellRaw: (label: string) => string
): string {
  const m = SUM_REGEX.exec(raw);
  if (!m) return "#ERR";
  const a = parseFloat(getCellRaw(m[1].toUpperCase())) || 0;
  const b = parseFloat(getCellRaw(m[2].toUpperCase())) || 0;
  return String(a + b);
}

function displayValue(
  raw: string,
  getCellRaw: (label: string) => string
): string {
  if (raw.startsWith("=")) {
    return evaluateFormula(raw, getCellRaw);
  }
  return raw;
}

// ---------- Main component ----------
export default function Spreadsheet() {
  const cells = useStorage((root) => root.cells);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();

  // Which cell is currently being edited locally
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Build a set of cells being edited by OTHER users
  const remoteEditingCells = new Set<string>();
  for (const other of others) {
    const ec = other.presence?.editingCell;
    if (ec) remoteEditingCells.add(ec);
  }

  const setCellValue = useMutation(
    ({ storage }, key: string, value: string) => {
      storage.get("cells").set(key, value);
    },
    []
  );

  const getCellRaw = useCallback(
    (label: string): string => {
      return cells?.get(label) ?? "";
    },
    [cells]
  );

  function startEdit(label: string) {
    const raw = cells?.get(label) ?? "";
    setEditingCell(label);
    setEditValue(raw);
    updateMyPresence({ editingCell: label });
  }

  function commitEdit(label: string, value: string) {
    setCellValue(label, value);
    setEditingCell(null);
    setEditValue("");
    updateMyPresence({ editingCell: null });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    label: string
  ) {
    if (e.key === "Enter") {
      commitEdit(label, editValue);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
      updateMyPresence({ editingCell: null });
    }
  }

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
          marginTop: 16,
        }}
      >
        {CELL_LABELS.map((label) => {
          const isEditing = editingCell === label;
          const isRemoteEditing = remoteEditingCells.has(label);
          const raw = cells?.get(label) ?? "";
          const displayed = displayValue(raw, getCellRaw);

          return (
            <div
              key={label}
              role="gridcell"
              data-cell={label}
              data-remote-editing={isRemoteEditing ? "true" : "false"}
              onClick={() => {
                if (!isEditing) startEdit(label);
              }}
              style={{
                border: isRemoteEditing
                  ? "2px solid #e53e3e"
                  : "1px solid #ccc",
                padding: isEditing ? 0 : "4px 6px",
                boxSizing: "border-box",
                fontFamily: "monospace",
                cursor: isEditing ? "default" : "pointer",
                background: isEditing ? "#fffde7" : "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(label, editValue)}
                  onKeyDown={(e) => handleKeyDown(e, label)}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                    padding: "4px 6px",
                    boxSizing: "border-box",
                    fontFamily: "monospace",
                    background: "transparent",
                    fontSize: "inherit",
                  }}
                />
              ) : (
                <span>{displayed}</span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
