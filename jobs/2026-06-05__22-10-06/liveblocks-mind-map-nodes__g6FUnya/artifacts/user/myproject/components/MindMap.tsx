import React, { useState, useCallback, useEffect, useRef } from "react";
import { LiveObject } from "@liveblocks/client";
import { useStorage, useMutation, MindMapNode } from "../liveblocks.config";

export default function MindMap() {
  const nodes = useStorage((root) => root.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const addNode = useMutation(({ storage }, x: number, y: number) => {
    const nodes = storage.get("nodes");
    const id = Math.random().toString(36).substr(2, 9);
    
    let parentId: string | null = null;
    if (nodes.size > 0) {
      if (selectedNodeId && nodes.has(selectedNodeId)) {
        parentId = selectedNodeId;
      } else {
        // Fallback: find root or just pick one
        const rootNode = Array.from(nodes.values()).find(n => n.get("parentId") === null);
        parentId = rootNode ? rootNode.get("id") : Array.from(nodes.keys())[0];
      }
    }

    const newNode = new LiveObject<MindMapNode>({
      id,
      label: "New Node",
      x,
      y,
      parentId,
    });
    nodes.set(id, newNode);
    setSelectedNodeId(id);
  }, [selectedNodeId]);

  const updateNodePosition = useMutation(({ storage }, id: string, x: number, y: number) => {
    const nodes = storage.get("nodes");
    const node = nodes.get(id);
    if (node) {
      node.update({ x, y });
    }
  }, []);

  const renameNode = useMutation(({ storage }, id: string, newLabel: string) => {
    const nodes = storage.get("nodes");
    const node = nodes.get(id);
    if (node) {
      node.update({ label: newLabel });
    }
  }, []);

  const deleteNodeRecursive = useMutation(({ storage }, id: string) => {
    const nodes = storage.get("nodes");
    
    const getDescendants = (parentId: string): string[] => {
      const descendants: string[] = [];
      for (const node of nodes.values()) {
        if (node.get("parentId") === parentId) {
          const childId = node.get("id");
          descendants.push(childId);
          descendants.push(...getDescendants(childId));
        }
      }
      return descendants;
    };

    const toDelete = [id, ...getDescendants(id)];
    toDelete.forEach((nodeId) => {
      nodes.delete(nodeId);
    });
    
    if (toDelete.includes(selectedNodeId!)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addNode(x, y);
    }
  };

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setDraggingNodeId(id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onNodePointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingNodeId === id && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateNodePosition(id, x, y);
    }
  };

  const onNodePointerUp = (e: React.PointerEvent, id: string) => {
    if (draggingNodeId === id) {
      setDraggingNodeId(null);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const onNodeDoubleClick = (e: React.MouseEvent, id: string, currentLabel: string) => {
    e.stopPropagation();
    const newLabel = window.prompt("Rename node", currentLabel);
    if (newLabel !== null) {
      renameNode(id, newLabel);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        deleteNodeRecursive(selectedNodeId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNodeId, deleteNodeRecursive]);

  if (!nodes) return null;

  const nodesArray = Array.from(nodes.values()).map(n => n.toObject());

  return (
    <svg
      ref={svgRef}
      data-testid="mind-map-canvas"
      style={{ width: "100vw", height: "100vh", backgroundColor: "#f0f0f0", touchAction: "none" }}
      onClick={onCanvasClick}
    >
      {/* Edges */}
      {nodesArray.map((node) => {
        if (!node.parentId) return null;
        const parent = nodesArray.find((n) => n.id === node.parentId);
        if (!parent) return null;
        return (
          <line
            key={`edge-${parent.id}-${node.id}`}
            x1={parent.x}
            y1={parent.y}
            x2={node.x}
            y2={node.y}
            stroke="#999"
            strokeWidth="2"
            data-testid="mind-map-edge"
            data-parent-id={parent.id}
            data-child-id={node.id}
          />
        );
      })}

      {/* Nodes */}
      {nodesArray.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="30"
            fill={selectedNodeId === node.id ? "#007bff" : "#fff"}
            stroke="#007bff"
            strokeWidth="2"
            onPointerDown={(e) => onNodePointerDown(e, node.id)}
            onPointerMove={(e) => onNodePointerMove(e, node.id)}
            onPointerUp={(e) => onNodePointerUp(e, node.id)}
            onDoubleClick={(e) => onNodeDoubleClick(e, node.id, node.label)}
            style={{ cursor: "move" }}
            data-testid="mind-map-node"
            data-node-id={node.id}
          />
          <text
            x={node.x}
            y={node.y}
            dy=".35em"
            textAnchor="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
            data-testid="mind-map-label"
            data-node-id={node.id}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
