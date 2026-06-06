"use client";

import React, { useState, useCallback } from "react";
import {
  useStorage,
  useMutation,
  useMyPresence,
  useOthers,
} from "@liveblocks/react/suspense";

const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5"
];

const SUM_REGEX = /^=SUM\(\s*([A-E][1-5])\s*,\s*([A-E][1-5])\s*\)$/i;

export default function SpreadsheetPage() {
  const cells = useStorage((root) => root.cells);
  const others = useOthers();
  const [{ editingCell }, setPresence] = useMyPresence();

  const updateCell = useMutation(({ storage }, key: string, value: string) => {
    storage.get("cells").set(key, value);
  }, []);

  const evaluateFormula = useCallback((value: string, allCells: ReadonlyMap<string, string>): string => {
    if (!value.startsWith("=")) return value;

    const match = value.match(SUM_REGEX);
    if (!match) return "#ERR";

    const [, ref1, ref2] = match;
    
    const getVal = (ref: string) => {
      const val = allCells.get(ref);
      if (!val) return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    return (getVal(ref1) + getVal(ref2)).toString();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Spreadsheet</h1>
      <div
        role="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 80px)",
          gridAutoRows: "32px",
          gap: 0,
          marginTop: 16
        }}
      >
        {CELL_LABELS.map((label) => {
          const rawValue = cells.get(label) || "";
          const isEditingLocally = editingCell === label;
          const remoteEditors = others.filter(other => other.presence.editingCell === label);
          const isEditingRemotely = remoteEditors.length > 0;

          return (
            <Cell
              key={label}
              label={label}
              rawValue={rawValue}
              displayValue={evaluateFormula(rawValue, cells)}
              isEditingLocally={isEditingLocally}
              isEditingRemotely={isEditingRemotely}
              onStartEdit={() => setPresence({ editingCell: label })}
              onEndEdit={(newValue) => {
                setPresence({ editingCell: null });
                if (newValue !== rawValue) {
                  updateCell(label, newValue);
                }
              }}
            />
          );
        })}
      </div>
    </main>
  );
}

function Cell({
  label,
  rawValue,
  displayValue,
  isEditingLocally,
  isEditingRemotely,
  onStartEdit,
  onEndEdit,
}: {
  label: string;
  rawValue: string;
  displayValue: string;
  isEditingLocally: boolean;
  isEditingRemotely: boolean;
  onStartEdit: () => void;
  onEndEdit: (val: string) => void;
}) {
  const [tempValue, setTempValue] = useState(rawValue);

  // Sync temp value when rawValue changes from storage, but only if not editing locally
  React.useEffect(() => {
    if (!isEditingLocally) {
      setTempValue(rawValue);
    }
  }, [rawValue, isEditingLocally]);

  if (isEditingLocally) {
    return (
      <div
        role="gridcell"
        data-cell={label}
        data-remote-editing={isEditingRemotely ? "true" : "false"}
        style={{
          border: isEditingRemotely ? "2px solid red" : "1px solid #ccc",
          boxSizing: "border-box",
        }}
      >
        <input
          autoFocus
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            padding: "4px 6px",
            fontFamily: "monospace",
            boxSizing: "border-box",
          }}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => onEndEdit(tempValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEndEdit(tempValue);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      role="gridcell"
      data-cell={label}
      data-remote-editing={isEditingRemotely ? "true" : "false"}
      onClick={onStartEdit}
      style={{
        border: isEditingRemotely ? "2px solid red" : "1px solid #ccc",
        padding: "4px 6px",
        boxSizing: "border-box",
        fontFamily: "monospace",
        cursor: "pointer",
        backgroundColor: "white",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {displayValue}
    </div>
  );
}
