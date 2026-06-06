import { useState, useEffect, useRef, useCallback } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { MindMapNode } from "../liveblocks.config";

export default function Page() {
  const nodes = useStorage((root) => root.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [localDragPosition, setLocalDragPosition] = useState<{ id: string; x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastUpdateTime = useRef<number>(0);

  // Convert nodes map to list defensively
  const nodesList: MindMapNode[] = [];
  if (nodes) {
    if (typeof (nodes as any).entries === "function") {
      for (const [_, val] of (nodes as any).entries()) {
        nodesList.push(val);
      }
    } else {
      for (const key in nodes) {
        if (Object.prototype.hasOwnProperty.call(nodes, key)) {
          nodesList.push((nodes as any)[key]);
        }
      }
    }
  }

  // Get current position of a node (accounting for local dragging)
  const getNodePos = useCallback(
    (node: MindMapNode) => {
      if (localDragPosition && localDragPosition.id === node.id) {
        return { x: localDragPosition.x, y: localDragPosition.y };
      }
      return { x: node.x, y: node.y };
    },
    [localDragPosition]
  );

  // Mutations
  const addNode = useMutation(
    ({ storage }, id: string, label: string, x: number, y: number, parentId: string | null) => {
      const nodesMap = storage.get("nodes");
      const newNode = new LiveObject<MindMapNode>({
        id,
        label,
        x,
        y,
        parentId,
      });
      nodesMap.set(id, newNode);
    },
    []
  );

  const updateNodePosition = useMutation(({ storage }, id: string, x: number, y: number) => {
    const node = storage.get("nodes").get(id);
    if (node) {
      node.update({ x, y });
    }
  }, []);

  const updateNodeLabel = useMutation(({ storage }, id: string, label: string) => {
    const node = storage.get("nodes").get(id);
    if (node) {
      node.set("label", label);
    }
  }, []);

  const deleteNodes = useMutation(({ storage }, idsToDelete: string[]) => {
    const nodesMap = storage.get("nodes");
    for (const id of idsToDelete) {
      nodesMap.delete(id);
    }
  }, []);

  const clearAllNodes = useMutation(({ storage }) => {
    const nodesMap = storage.get("nodes");
    for (const key of Array.from(nodesMap.keys())) {
      nodesMap.delete(key);
    }
  }, []);

  // Throttled position update
  const updateNodePositionThrottled = useCallback(
    (id: string, x: number, y: number) => {
      const now = Date.now();
      if (now - lastUpdateTime.current > 30) {
        updateNodePosition(id, x, y);
        lastUpdateTime.current = now;
      }
    },
    [updateNodePosition]
  );

  // Helper for recursive descendants
  const getDescendantIds = useCallback((parentId: string, list: MindMapNode[]): string[] => {
    const children = list.filter((n) => n.parentId === parentId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id, list));
    }
    return ids;
  }, []);

  // Keyboard listener for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          const descendants = getDescendantIds(selectedNodeId, nodesList);
          const toDelete = [selectedNodeId, ...descendants];
          deleteNodes(toDelete);
          setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNodeId, nodesList, getDescendantIds, deleteNodes]);

  // SVG interactions
  const handleBgPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.button !== 0) return; // Only left click

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Generate unique ID
    const id = Math.random().toString(36).substring(2, 9);

    // Determine parentId
    let parentId: string | null = null;
    if (nodesList.length > 0) {
      if (selectedNodeId) {
        parentId = selectedNodeId;
      } else {
        const rootNode = nodesList.find((n) => n.parentId === null);
        if (rootNode) {
          parentId = rootNode.id;
        } else {
          parentId = nodesList[0].id;
        }
      }
    }

    const label = parentId === null ? "Root" : `Node ${nodesList.length + 1}`;
    addNode(id, label, x, y, parentId);
    setSelectedNodeId(id);
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: MindMapNode) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }

    setDraggedNodeId(node.id);
    setSelectedNodeId(node.id);

    dragStartOffset.current = {
      x: pointerX - node.x,
      y: pointerY - node.y,
    };

    setLocalDragPosition({ id: node.id, x: node.x, y: node.y });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!draggedNodeId) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const newX = pointerX - dragStartOffset.current.x;
    const newY = pointerY - dragStartOffset.current.y;

    setLocalDragPosition({ id: draggedNodeId, x: newX, y: newY });
    updateNodePositionThrottled(draggedNodeId, newX, newY);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (draggedNodeId) {
      if (localDragPosition) {
        updateNodePosition(localDragPosition.id, localDragPosition.x, localDragPosition.y);
      }
      if (svgRef.current) {
        svgRef.current.releasePointerCapture(e.pointerId);
      }
      setDraggedNodeId(null);
      setLocalDragPosition(null);
    }
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation();
    const newLabel = window.prompt("Rename node:", node.label);
    if (newLabel !== null) {
      const trimmed = newLabel.trim();
      if (trimmed !== "") {
        updateNodeLabel(node.id, trimmed);
      }
    }
  };

  if (!nodes) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          color: "#64748b",
        }}
      >
        Connecting to collaborative session...
      </div>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* UI Controls Overlay */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.9)",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          maxWidth: 320,
          pointerEvents: "auto",
        }}
      >
        <h1 style={{ fontSize: 18, margin: "0 0 8px 0", color: "#0f172a" }}>Collaborative Mind Map</h1>
        <p style={{ fontSize: 12, margin: "0 0 12px 0", color: "#475569", lineHeight: 1.4 }}>
          • Click empty canvas to add a node.<br />
          • Drag a node to move it.<br />
          • Double-click to rename.<br />
          • Press Delete/Backspace to delete a node and its descendants.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSelectedNodeId(null)}
            disabled={!selectedNodeId}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              cursor: selectedNodeId ? "pointer" : "not-allowed",
              opacity: selectedNodeId ? 1 : 0.5,
            }}
          >
            Clear Selection
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear the entire map?")) {
                clearAllNodes();
                setSelectedNodeId(null);
              }
            }}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Reset Map
          </button>
        </div>
      </div>

      {/* SVG Mind Map Canvas */}
      <svg
        ref={svgRef}
        data-testid="mind-map-canvas"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        {/* Clickable Background */}
        <rect
          width="100%"
          height="100%"
          fill="#f8fafc"
          onPointerDown={handleBgPointerDown}
        />

        {/* Connector Lines (Edges) */}
        {nodesList.map((node) => {
          if (!node.parentId) return null;
          const parent = nodesList.find((n) => n.id === node.parentId);
          if (!parent) return null;

          const pPos = getNodePos(parent);
          const cPos = getNodePos(node);

          return (
            <line
              key={`edge-${node.parentId}-${node.id}`}
              data-testid="mind-map-edge"
              data-parent-id={node.parentId}
              data-child-id={node.id}
              x1={pPos.x}
              y1={pPos.y}
              x2={cPos.x}
              y2={cPos.y}
              stroke="#94a3b8"
              strokeWidth={2.5}
            />
          );
        })}

        {/* Node Elements */}
        {nodesList.map((node) => {
          const pos = getNodePos(node);
          const isSelected = selectedNodeId === node.id;

          return (
            <g key={node.id}>
              {/* Node Circle */}
              <circle
                data-testid="mind-map-node"
                data-node-id={node.id}
                cx={pos.x}
                cy={pos.y}
                r={32}
                fill={isSelected ? "#eff6ff" : "#ffffff"}
                stroke={isSelected ? "#ef4444" : "#3b82f6"}
                strokeWidth={isSelected ? 4 : 2}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                onClick={(e) => e.stopPropagation()}
              />
              {/* Node Label Text */}
              <text
                data-testid="mind-map-label"
                data-node-id={node.id}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#1e3a8a"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </main>
  );
}
