import { useCallback, useEffect, useRef, useState } from "react";
import { useStorage, useMutation, RoomProvider } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import type { MindMapNode } from "../liveblocks.config";

// ---------- Helper: collect all descendant IDs recursively ----------

function collectDescendants(
  nodes: Map<string, MindMapNode>,
  parentId: string
): string[] {
  const ids: string[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === parentId) {
      ids.push(node.id);
      ids.push(...collectDescendants(nodes, node.id));
    }
  }
  return ids;
}

// ---------- Inline rename input ----------

function InlineInput({
  defaultValue,
  onCommit,
}: {
  defaultValue: string;
  onCommit: (val: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value);
        if (e.key === "Escape") onCommit(defaultValue);
      }}
      style={{
        width: 80,
        fontSize: 12,
        textAlign: "center",
        border: "1px solid #3b82f6",
        borderRadius: 4,
        outline: "none",
        padding: "2px 4px",
      }}
    />
  );
}

// ---------- Main MindMap component ----------

function MindMapCanvas() {
  const nodes = useStorage((root) => root.nodes);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const dragging = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // ------- Create node on empty canvas click -------
  const createNode = useMutation(
    ({ storage }, x: number, y: number) => {
      const nodesMap = storage.get("nodes");
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Determine parentId: null if empty (root), otherwise attach to selected or root
      let parentId: string | null = null;
      const existingEntries = Array.from(nodesMap.entries());
      if (existingEntries.length > 0) {
        if (selectedNodeId) {
          parentId = selectedNodeId;
        } else {
          // Find the root node (parentId === null)
          const rootEntry = existingEntries.find(
            ([, node]) => node.toObject().parentId === null
          );
          parentId = rootEntry ? rootEntry[0] : existingEntries[0][0];
        }
      }

      nodesMap.set(
        id,
        new LiveObject({
          id,
          label: "New node",
          x,
          y,
          parentId,
        })
      );
    },
    [selectedNodeId]
  );

  // ------- Move node (used during drag) -------
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

  // ------- Rename node -------
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

  // ------- Delete node and descendants -------
  const deleteNode = useMutation(
    ({ storage }, id: string) => {
      const nodesMap = storage.get("nodes");

      // Collect all descendant IDs
      const allNodes = new Map<string, MindMapNode>();
      for (const [key, liveObj] of nodesMap.entries()) {
        allNodes.set(key, liveObj.toObject());
      }

      const toDelete = [id, ...collectDescendants(allNodes, id)];
      for (const delId of toDelete) {
        nodesMap.delete(delId);
      }

      // Orphan fix: any node whose parentId was deleted but wasn't a descendant
      for (const [, liveObj] of nodesMap.entries()) {
        const data = liveObj.toObject();
        if (data.parentId && toDelete.includes(data.parentId)) {
          liveObj.update({ parentId: null });
        }
      }
    },
    []
  );

  // ------- Keyboard handler for delete -------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedNodeId &&
        !renamingNodeId
      ) {
        // Don't delete if we're in an input element
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        deleteNode(selectedNodeId);
        setSelectedNodeId(null);
        setRenamingNodeId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, renamingNodeId, deleteNode]);

  // ------- SVG click handler -------
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Only handle clicks on the SVG background, not on nodes
      if ((e.target as SVGElement).getAttribute("data-testid") === "mind-map-canvas") {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createNode(x, y);
        setSelectedNodeId(null);
      }
    },
    [createNode]
  );

  // ------- Drag handlers -------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      setSelectedNodeId(nodeId);
      setRenamingNodeId(null);

      const nodeData = nodes?.get(nodeId)?.toObject();
      if (!nodeData) return;

      dragging.current = {
        id: nodeId,
        offsetX: e.clientX - nodeData.x,
        offsetY: e.clientY - nodeData.y,
      };

      (e.target as SVGElement).setPointerCapture(e.pointerId);
    },
    [nodes]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const { id, offsetX, offsetY } = dragging.current;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      moveNode(id, x, y);
    },
    [moveNode]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // ------- Double-click to rename -------
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setRenamingNodeId(nodeId);
    },
    []
  );

  // ------- Render -------
  const nodeEntries = nodes ? Array.from(nodes.entries()) : [];

  return (
    <svg
      data-testid="mind-map-canvas"
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f8fafc",
        cursor: "crosshair",
      }}
      onClick={handleSvgClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Edges */}
      {nodeEntries.map(([, liveObj]) => {
        const node = liveObj.toObject();
        if (node.parentId === null) return null;
        const parentNode = nodes?.get(node.parentId);
        if (!parentNode) return null;
        const parent = parentNode.toObject();
        return (
          <line
            key={`edge-${node.id}`}
            data-testid="mind-map-edge"
            data-parent-id={parent.id}
            data-child-id={node.id}
            x1={parent.x}
            y1={parent.y}
            x2={node.x}
            y2={node.y}
            stroke="#94a3b8"
            strokeWidth={2}
          />
        );
      })}

      {/* Nodes */}
      {nodeEntries.map(([, liveObj]) => {
        const node = liveObj.toObject();
        const isSelected = selectedNodeId === node.id;
        const isRenaming = renamingNodeId === node.id;

        return (
          <g key={node.id}>
            <circle
              data-testid="mind-map-node"
              data-node-id={node.id}
              cx={node.x}
              cy={node.y}
              r={20}
              fill={isSelected ? "#3b82f6" : "#60a5fa"}
              stroke={isSelected ? "#1d4ed8" : "#3b82f6"}
              strokeWidth={isSelected ? 3 : 2}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              onDoubleClick={(e) => handleDoubleClick(e, node.id)}
              onClick={(e) => e.stopPropagation()}
            />
            {isRenaming ? (
              <foreignObject
                x={node.x - 50}
                y={node.y + 22}
                width={100}
                height={30}
                style={{ overflow: "visible" }}
              >
                <InlineInput
                  defaultValue={node.label}
                  onCommit={(val) => {
                    renameNode(node.id, val);
                    setRenamingNodeId(null);
                  }}
                />
              </foreignObject>
            ) : (
              <text
                data-testid="mind-map-label"
                data-node-id={node.id}
                x={node.x}
                y={node.y + 34}
                textAnchor="middle"
                fontSize={12}
                fill="#334155"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Page with RoomProvider ----------

const RUN_ID = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "local";
const ROOM_ID = `mind-map-${RUN_ID}`;

export default function Page() {
  return (
    <RoomProvider
      id={ROOM_ID}
      initialPresence={{}}
      initialStorage={{ nodes: new LiveMap() }}
    >
      <MindMapCanvas />
    </RoomProvider>
  );
}