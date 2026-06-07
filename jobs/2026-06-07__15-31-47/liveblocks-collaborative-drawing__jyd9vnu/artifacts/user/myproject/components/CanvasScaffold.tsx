"use client";

import React, { useCallback, useRef, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { useStorage, useMutation, useSelf } from "@/lib/liveblocks";
import { nanoid } from "nanoid";

type Tool = "pen" | "eraser";

export function CanvasScaffold({ userId }: { userId: string }) {
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>("#000000");
  const [width, setWidth] = useState<number>(4);

  // Track whether we're currently drawing
  const isDrawing = useRef(false);
  // ID of the stroke currently being drawn
  const activeStrokeId = useRef<string | null>(null);
  // Throttle timer for pointermove
  const lastMoveTime = useRef<number>(0);

  // Read all strokes from Liveblocks storage
  const strokes = useStorage((root) => root.strokes);

  // Mutation: start a new stroke on pointerdown
  const startStroke = useMutation(
    ({ storage }, strokeId: string, x: number, y: number) => {
      const strokesList = storage.get("strokes");
      const pointsList = new LiveList([
        new LiveObject({ x, y }),
      ]);
      const stroke = new LiveObject({
        id: strokeId,
        userId,
        color,
        width,
        points: pointsList,
      });
      strokesList.push(stroke);
    },
    [userId, color, width]
  );

  // Mutation: append a point to the active stroke
  const appendPoint = useMutation(
    ({ storage }, strokeId: string, x: number, y: number) => {
      const strokesList = storage.get("strokes");
      for (let i = 0; i < strokesList.length; i++) {
        const stroke = strokesList.get(i);
        if (stroke && stroke.get("id") === strokeId) {
          stroke.get("points").push(new LiveObject({ x, y }));
          break;
        }
      }
    },
    []
  );

  // Mutation: delete a stroke by id
  const deleteStroke = useMutation(({ storage }, strokeId: string) => {
    const strokesList = storage.get("strokes");
    for (let i = 0; i < strokesList.length; i++) {
      const stroke = strokesList.get(i);
      if (stroke && stroke.get("id") === strokeId) {
        strokesList.delete(i);
        break;
      }
    }
  }, []);

  // Mutation: undo the current user's last stroke
  const undoMine = useMutation(
    ({ storage }) => {
      const strokesList = storage.get("strokes");
      // Find the last stroke authored by this user
      for (let i = strokesList.length - 1; i >= 0; i--) {
        const stroke = strokesList.get(i);
        if (stroke && stroke.get("userId") === userId) {
          strokesList.delete(i);
          break;
        }
      }
    },
    [userId]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (tool === "eraser") return; // eraser handled via click on polyline

      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const strokeId = nanoid();
      activeStrokeId.current = strokeId;
      isDrawing.current = true;
      lastMoveTime.current = Date.now();

      startStroke(strokeId, x, y);
    },
    [tool, startStroke]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawing.current || !activeStrokeId.current) return;

      const now = Date.now();
      if (now - lastMoveTime.current < 30) return; // throttle to ~30ms
      lastMoveTime.current = now;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      appendPoint(activeStrokeId.current, x, y);
    },
    [appendPoint]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<SVGSVGElement>) => {
      isDrawing.current = false;
      activeStrokeId.current = null;
    },
    []
  );

  const handlePolylineClick = useCallback(
    (strokeId: string) => {
      if (tool !== "eraser") return;
      deleteStroke(strokeId);
    },
    [tool, deleteStroke]
  );

  return (
    <div style={{ padding: 16 }}>
      <h1>Collaborative Drawing</h1>
      <p>
        User: <strong data-testid="current-user">{userId}</strong>
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <label>
          Color
          <input
            data-testid="color-picker"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ marginLeft: 4, width: 96 }}
          />
        </label>
        <label>
          Width
          <input
            data-testid="width-picker"
            type="number"
            min={1}
            max={32}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{ marginLeft: 4, width: 64 }}
          />
        </label>
        <button
          data-testid="tool-pen"
          onClick={() => setTool("pen")}
          aria-pressed={tool === "pen"}
          style={{ fontWeight: tool === "pen" ? "bold" : "normal" }}
        >
          Pen
        </button>
        <button
          data-testid="tool-eraser"
          onClick={() => setTool("eraser")}
          aria-pressed={tool === "eraser"}
          style={{ fontWeight: tool === "eraser" ? "bold" : "normal" }}
        >
          Eraser
        </button>
        <button data-testid="undo-mine" onClick={() => undoMine()}>
          Undo my last stroke
        </button>
      </div>
      <svg
        data-testid="canvas"
        width={1024}
        height={720}
        viewBox="0 0 1024 720"
        style={{
          background: "#fafafa",
          border: "1px solid #ddd",
          cursor: tool === "eraser" ? "crosshair" : "default",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {strokes &&
          strokes.map((stroke) => {
            const strokeId = stroke.id;
            const strokeUserId = stroke.userId;
            const points = stroke.points
              .map((p) => `${p.x},${p.y}`)
              .join(" ");

            return (
              <polyline
                key={strokeId}
                data-stroke-id={strokeId}
                data-user-id={strokeUserId}
                points={points}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  cursor: tool === "eraser" ? "pointer" : "default",
                  pointerEvents: tool === "eraser" ? "stroke" : "none",
                }}
                onClick={() => handlePolylineClick(strokeId)}
              />
            );
          })}
      </svg>
    </div>
  );
}
