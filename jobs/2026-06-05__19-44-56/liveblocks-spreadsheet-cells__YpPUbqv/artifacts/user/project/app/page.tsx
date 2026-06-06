"use client";

import { LiveMap } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
  useMyPresence,
  useOthers
} from "@liveblocks/react";
import { useState, useRef, useEffect } from "react";
import { Presence, Storage } from "../liveblocks.config";

const CELL_LABELS = [
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4", "D5",
  "E1", "E2", "E3", "E4", "E5"
];

const ROOM_ID = `spreadsheet-${process.env.NEXT_PUBLIC_ZEALT_RUN_ID}`;

export default function SpreadsheetPage() {
  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_1";
  
  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={ROOM_ID}
        initialPresence={{ editingCell: null }}
        initialStorage={{ cells: new LiveMap<string, string>() }}
      >
        <main style={{ padding: 24 }}>
          <h1>Collaborative Spreadsheet</h1>
          <ClientSideSuspense fallback={<FallbackGrid />}>
            {() => <Spreadsheet />}
          </ClientSideSuspense>
        </main>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function FallbackGrid() {
  return (
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
      {CELL_LABELS.map((label) => (
        <div
          key={label}
          role="gridcell"
          data-cell={label}
          style={{
            border: "1px solid #ccc",
            padding: "4px 6px",
            boxSizing: "border-box",
            fontFamily: "monospace"
          }}
        >
          ...
        </div>
      ))}
    </div>
  );
}

function Spreadsheet() {
  const cells = useStorage((root) => root.cells);
  const updateCell = useMutation(({ storage }, key: string, value: string) => {
    storage.get("cells").set(key, value);
  }, []);
  
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const getRemoteEditors = (cellId: string) => {
    return others.filter(other => other.presence.editingCell === cellId);
  };

  const evaluateFormula = (val: string | undefined, visited = new Set<string>()): string => {
    if (!val) return "";
    const trimmedVal = val.trim();
    if (trimmedVal.startsWith("=")) {
      const match = trimmedVal.match(/^=SUM\(\s*([A-E][1-5])\s*,\s*([A-E][1-5])\s*\)$/i);
      if (match) {
        const ref1 = match[1].toUpperCase();
        const ref2 = match[2].toUpperCase();
        
        if (visited.has(ref1) || visited.has(ref2)) {
          return "#ERR"; // Circular reference
        }
        
        const newVisited = new Set(visited);
        newVisited.add(ref1);
        newVisited.add(ref2);

        const val1 = evaluateFormula(cells?.get(ref1), newVisited);
        const val2 = evaluateFormula(cells?.get(ref2), newVisited);
        
        const num1 = val1 ? parseFloat(val1) : 0;
        const num2 = val2 ? parseFloat(val2) : 0;
        
        const parsed1 = isNaN(num1) ? 0 : num1;
        const parsed2 = isNaN(num2) ? 0 : num2;
        
        return (parsed1 + parsed2).toString();
      }
      return "#ERR";
    }
    return val;
  };

  return (
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
        const value = cells?.get(label) || "";
        const displayValue = evaluateFormula(value, new Set([label]));
        const isEditing = myPresence.editingCell === label;
        const remoteEditors = getRemoteEditors(label);
        const isRemoteEditing = remoteEditors.length > 0;

        return (
          <Cell
            key={label}
            label={label}
            value={value}
            displayValue={displayValue}
            isEditing={isEditing}
            isRemoteEditing={isRemoteEditing}
            onStartEdit={() => updateMyPresence({ editingCell: label })}
            onEndEdit={(newValue) => {
              updateCell(label, newValue);
              updateMyPresence({ editingCell: null });
            }}
          />
        );
      })}
    </div>
  );
}

function Cell({
  label,
  value,
  displayValue,
  isEditing,
  isRemoteEditing,
  onStartEdit,
  onEndEdit
}: {
  label: string;
  value: string;
  displayValue: string;
  isEditing: boolean;
  isRemoteEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (val: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div
      role="gridcell"
      data-cell={label}
      data-remote-editing={isRemoteEditing ? "true" : "false"}
      onClick={() => {
        if (!isEditing) {
          onStartEdit();
        }
      }}
      style={{
        border: isRemoteEditing ? "2px solid red" : "1px solid #ccc",
        padding: "4px 6px",
        boxSizing: "border-box",
        fontFamily: "monospace",
        cursor: "text",
        overflow: "hidden"
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onEndEdit(localValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEndEdit(localValue);
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            padding: 0,
            margin: 0,
            fontFamily: "inherit",
            fontSize: "inherit"
          }}
        />
      ) : (
        displayValue
      )}
    </div>
  );
}
