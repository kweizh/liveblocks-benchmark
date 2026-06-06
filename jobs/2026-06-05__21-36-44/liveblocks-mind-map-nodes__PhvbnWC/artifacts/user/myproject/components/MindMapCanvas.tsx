import React, { useCallback, useEffect, useRef, useState } from "react";
import { LiveObject } from "@liveblocks/client";
import { MindMapNode, useMutation, useStorage } from "../liveblocks.config";

const NODE_RADIUS = 36;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function MindMapCanvas() {
  const nodes = useStorage((root) => root.nodes);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);
  const lastMoveTime = useRef<number>(0);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addNode = useMutation(
    ({ storage }, x: number, y: number, parentId: string | null) => {
      const id = generateId();
      const nodesMap = storage.get("nodes");
      const node: MindMapNode = { id, label: "Node", x, y, parentId };
      nodesMap.set(id, new LiveObject(node));
    },
    []
  );

  const moveNode = useMutation(
    ({ storage }, id: string, x: number, y: number) => {
      const nodesMap = storage.get("nodes");
      const node = nodesMap.get(id);
      if (node) {
        node.update({ x, y });
      }
    },
    []
  );

  const renameNode = useMutation(
    ({ storage }, id: string, label: string) => {
      const nodesMap = storage.get("nodes");
      const node = nodesMap.get(id);
      if (node) {
        node.update({ label });
      }
    },
    []
  );

  const deleteNodeAndDescendants = useMutation(
    ({ storage }, id: string) => {
      const nodesMap = storage.get("nodes");

      // Collect all node ids to delete (target + all descendants)
      const toDelete = new Set<string>();
      const queue = [id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        toDelete.add(current);
        // Find children of current
        nodesMap.forEach((node, nodeId) => {
          if (node.get("parentId") === current) {
            queue.push(nodeId);
          }
        });
      }

      toDelete.forEach((deleteId) => {
        nodesMap.delete(deleteId);
      });
    },
    []
  );

  // ─── SVG coordinate helper ────────────────────────────────────────────────

  const getSVGCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: clientX, y: clientY };
      const rect = svg.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // ─── Hit-test: is (x,y) over an existing node? ───────────────────────────

  const hitNode = useCallback(
    (svgX: number, svgY: number): string | null => {
      if (!nodes) return null;
      for (const [id, node] of nodes) {
        const dx = svgX - node.x;
        const dy = svgY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) {
          return id;
        }
      }
      return null;
    },
    [nodes]
  );

  // ─── Canvas click: create node ────────────────────────────────────────────

  const handleSVGPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.target !== svgRef.current) return; // clicked on a child element
      const { x, y } = getSVGCoords(e.clientX, e.clientY);
      const hit = hitNode(x, y);
      if (hit) return; // shouldn't happen since we checked target, but safety

      // Determine parentId
      let parentId: string | null = null;
      if (nodes && nodes.size > 0) {
        // Use selected node as parent, or fall back to root (parentId === null)
        if (selectedId && nodes.has(selectedId)) {
          parentId = selectedId;
        } else {
          // find root
          for (const [id, node] of nodes) {
            if (node.parentId === null) {
              parentId = id;
              break;
            }
          }
        }
      }

      addNode(x, y, parentId);
      setSelectedId(null);
    },
    [getSVGCoords, hitNode, nodes, selectedId, addNode]
  );

  // ─── Node pointer down: start drag / select ───────────────────────────────

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>, id: string) => {
      e.stopPropagation();
      if (!nodes) return;
      const node = nodes.get(id);
      if (!node) return;
      const { x, y } = getSVGCoords(e.clientX, e.clientY);
      setDragging({ id, offsetX: x - node.x, offsetY: y - node.y });
      setSelectedId(id);
      (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
    },
    [nodes, getSVGCoords]
  );

  // ─── SVG pointer move: drag ───────────────────────────────────────────────

  const handleSVGPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const now = Date.now();
      if (now - lastMoveTime.current < 30) return; // throttle ~33fps
      lastMoveTime.current = now;
      const { x, y } = getSVGCoords(e.clientX, e.clientY);
      moveNode(dragging.id, x - dragging.offsetX, y - dragging.offsetY);
    },
    [dragging, getSVGCoords, moveNode]
  );

  // ─── Pointer up: end drag ─────────────────────────────────────────────────

  const handleSVGPointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ─── Double-click to rename ───────────────────────────────────────────────

  const handleNodeDoubleClick = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, id: string) => {
      e.stopPropagation();
      if (!nodes) return;
      const node = nodes.get(id);
      if (!node) return;
      setEditingId(id);
      setEditingLabel(node.label);
    },
    [nodes]
  );

  // ─── Inline label editing ─────────────────────────────────────────────────

  const commitEdit = useCallback(() => {
    if (editingId && editingLabel.trim()) {
      renameNode(editingId, editingLabel.trim());
    }
    setEditingId(null);
    setEditingLabel("");
  }, [editingId, editingLabel, renameNode]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitEdit();
      if (e.key === "Escape") {
        setEditingId(null);
        setEditingLabel("");
      }
    },
    [commitEdit]
  );

  // ─── Delete key ───────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return; // don't delete while renaming
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteNodeAndDescendants(selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, editingId, deleteNodeAndDescendants]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!nodes) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Connecting to Liveblocks…</p>
      </div>
    );
  }

  const nodeEntries = Array.from(nodes.entries());

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <svg
        ref={svgRef}
        data-testid="mind-map-canvas"
        width="100%"
        height="100%"
        style={{ background: "#f8f9fa", cursor: dragging ? "grabbing" : "crosshair", display: "block" }}
        onPointerDown={handleSVGPointerDown}
        onPointerMove={handleSVGPointerMove}
        onPointerUp={handleSVGPointerUp}
      >
        {/* Edges */}
        {nodeEntries.map(([id, node]) => {
          if (!node.parentId) return null;
          const parent = nodes.get(node.parentId);
          if (!parent) return null;
          return (
            <line
              key={`edge-${id}`}
              data-testid="mind-map-edge"
              data-parent-id={node.parentId}
              data-child-id={id}
              x1={parent.x}
              y1={parent.y}
              x2={node.x}
              y2={node.y}
              stroke="#94a3b8"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {nodeEntries.map(([id, node]) => {
          const isSelected = selectedId === id;
          const isEditing = editingId === id;
          return (
            <g key={id}>
              <circle
                data-testid="mind-map-node"
                data-node-id={id}
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={node.parentId === null ? "#6366f1" : "#3b82f6"}
                stroke={isSelected ? "#f59e0b" : "#fff"}
                strokeWidth={isSelected ? 3 : 2}
                style={{ cursor: "grab" }}
                onPointerDown={(e) => handleNodePointerDown(e, id)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, id)}
              />
              {!isEditing && (
                <text
                  data-testid="mind-map-label"
                  data-node-id={id}
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={13}
                  fontFamily="sans-serif"
                  fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label.length > 10 ? node.label.slice(0, 9) + "…" : node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating inline editor (rendered outside SVG to use HTML <input>) */}
      {editingId && nodes.get(editingId) && (() => {
        const node = nodes.get(editingId)!;
        const svg = svgRef.current;
        const rect = svg ? svg.getBoundingClientRect() : { left: 0, top: 0 };
        return (
          <input
            autoFocus
            value={editingLabel}
            onChange={(e) => setEditingLabel(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            style={{
              position: "fixed",
              left: rect.left + node.x - 60,
              top: rect.top + node.y - 14,
              width: 120,
              height: 28,
              textAlign: "center",
              fontSize: 13,
              fontWeight: "600",
              border: "2px solid #f59e0b",
              borderRadius: 6,
              outline: "none",
              background: "#1e293b",
              color: "#fff",
              zIndex: 100,
            }}
          />
        );
      })()}

      {/* Instructions overlay */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.85)",
          color: "#e2e8f0",
          padding: "8px 18px",
          borderRadius: 8,
          fontSize: 12,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        Click canvas to add node · Drag to move · Double-click to rename · Select + Delete to remove
      </div>
    </div>
  );
}
