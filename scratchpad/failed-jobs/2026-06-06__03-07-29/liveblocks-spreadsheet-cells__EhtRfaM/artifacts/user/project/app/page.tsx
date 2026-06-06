"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
  ClientSideSuspense,
} from "@liveblocks/react";
import { LiveMap } from "@liveblocks/client";
import { useState, useCallback, useMemo } from "react";

const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5",
];

const SUM_REGEX = /^=SUM\(\s*([A-E][1-5])\s*,\s*([A-E][1-5])\s*\)$/i;

function evaluateFormula(
  rawValue: string,
  getCellValue: (label: string) => string | undefined
): string {
  const match = rawValue.match(SUM_REGEX);
  if (!match) {
    return "#ERR";
  }
  const ref1 = match[1].toUpperCase();
  const ref2 = match[2].toUpperCase();
  const val1 = parseFloat(getCellValue(ref1) || "");
  const val2 = parseFloat(getCellValue(ref2) || "");
  const num1 = isNaN(val1) ? 0 : val1;
  const num2 = isNaN(val2) ? 0 : val2;
  return String(num1 + num2);
}

function Spreadsheet() {
  const cells = useStorage((root) => root.cells);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const updateCell = useMutation(({ storage }, key: string, value: string) => {
    storage.get("cells").set(key, value);
  }, []);

  const getCellValue = useCallback(
    (label: string) => {
      if (!cells) return undefined;
      const val = cells.get(label);
      return val ?? undefined;
    },
    [cells]
  );

  const getDisplayValue = useCallback(
    (label: string) => {
      const raw = getCellValue(label);
      if (raw === undefined || raw === null || raw === "") return "";
      if (raw.startsWith("=")) {
        return evaluateFormula(raw, getCellValue);
      }
      return raw;
    },
    [getCellValue]
  );

  const remoteEditingCells = useMemo(() => {
    const set = new Set<string>();
    others.forEach((other) => {
      if (other.presence?.editingCell) {
        set.add(other.presence.editingCell);
      }
    });
    return set;
  }, [others]);

  const handleCellClick = (label: string) => {
    if (editingCell === label) return;
    // Save current edit if any
    if (editingCell !== null) {
      updateCell(editingCell, editValue);
    }
    const currentVal = getCellValue(label) ?? "";
    setEditValue(currentVal);
    setEditingCell(label);
    updateMyPresence({ editingCell: label });
  };

  const handleFinishEdit = useCallback(() => {
    if (editingCell !== null) {
      updateCell(editingCell, editValue);
      setEditingCell(null);
      setEditValue("");
      updateMyPresence({ editingCell: null });
    }
  }, [editingCell, editValue, updateCell, updateMyPresence]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      role="grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 80px)",
        gridAutoRows: "32px",
        gap: 0,
      }}
    >
      {CELL_LABELS.map((label) => {
        const isEditing = editingCell === label;
        const isRemoteEditing = remoteEditingCells.has(label);
        const displayValue = getDisplayValue(label);

        return (
          <div
            key={label}
            role="gridcell"
            data-cell={label}
            data-remote-editing={isRemoteEditing ? "true" : "false"}
            onClick={() => handleCellClick(label)}
            style={{
              border: isRemoteEditing ? "2px solid orange" : "1px solid #ccc",
              padding: "4px 6px",
              boxSizing: "border-box",
              fontFamily: "monospace",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleFinishEdit}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontFamily: "monospace",
                  fontSize: "inherit",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                }}
              />
            ) : (
              displayValue
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridFallback() {
  return (
    <div
      role="grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 80px)",
        gridAutoRows: "32px",
        gap: 0,
      }}
    >
      {CELL_LABELS.map((label) => (
        <div
          key={label}
          role="gridcell"
          data-cell={label}
          data-remote-editing="false"
          style={{
            border: "1px solid #ccc",
            padding: "4px 6px",
            boxSizing: "border-box",
            fontFamily: "monospace",
          }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  const roomId = `spreadsheet-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!;

  return (
    <LiveblocksProvider publicApiKey={publicKey}>
      <RoomProvider
        id={roomId}
        initialStorage={{ cells: new LiveMap() }}
        initialPresence={{ editingCell: null }}
      >
        <ClientSideSuspense fallback={<GridFallback />}>
          {() => <Spreadsheet />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}