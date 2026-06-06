import React, { useState, useRef, useEffect } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";

type MindMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  parentId: string | null;
};

export default function MindMap() {
  const nodes = useStorage((root: any) => root.nodes as ReadonlyMap<string, MindMapNode>);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const addNode = useMutation(({ storage }, x: number, y: number) => {
    const liveNodes = storage.get("nodes") as unknown as LiveMap<string, LiveObject<MindMapNode>>;
    const id = Math.random().toString(36).slice(2);
    
    let parentId: string | null = null;
    if (liveNodes.size > 0) {
      parentId = selectedNodeId || Array.from(liveNodes.keys())[0];
    }

    liveNodes.set(
      id,
      new LiveObject<MindMapNode>({
        id,
        label: "New Node",
        x,
        y,
        parentId,
      })
    );
    setSelectedNodeId(id);
  }, [selectedNodeId]);

  const updateNodePosition = useMutation(({ storage }, id: string, x: number, y: number) => {
    const liveNodes = storage.get("nodes") as unknown as LiveMap<string, LiveObject<MindMapNode>>;
    const node = liveNodes.get(id);
    if (node) {
      node.update({ x, y });
    }
  }, []);

  const renameNode = useMutation(({ storage }, id: string, newLabel: string) => {
    const liveNodes = storage.get("nodes") as unknown as LiveMap<string, LiveObject<MindMapNode>>;
    const node = liveNodes.get(id);
    if (node) {
      node.update({ label: newLabel });
    }
  }, []);

  const deleteNodeAndDescendants = useMutation(({ storage }, id: string) => {
    const liveNodes = storage.get("nodes") as unknown as LiveMap<string, LiveObject<MindMapNode>>;
    
    const getDescendants = (parentId: string): string[] => {
      const descendants: string[] = [];
      for (const [nodeId, node] of liveNodes.entries()) {
        if (node.get("parentId") === parentId) {
          descendants.push(nodeId);
          descendants.push(...getDescendants(nodeId));
        }
      }
      return descendants;
    };

    const toDelete = [id, ...getDescendants(id)];
    for (const nodeId of toDelete) {
      liveNodes.delete(nodeId);
    }
    
    if (selectedNodeId && toDelete.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const nodeId = target.getAttribute("data-node-id");

    if (nodeId) {
      setSelectedNodeId(nodeId);
      setDraggingNodeId(nodeId);
      e.stopPropagation();
    } else {
      setSelectedNodeId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingNodeId && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        updateNodePosition(draggingNodeId, x, y);
      }
    }
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const nodeId = target.getAttribute("data-node-id");

    if (nodeId) {
      const node = nodes?.get(nodeId);
      if (node) {
        const newLabel = prompt("Enter new label:", node.label);
        if (newLabel !== null) {
          renameNode(nodeId, newLabel);
        }
      }
      e.stopPropagation();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        addNode(x, y);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        deleteNodeAndDescendants(selectedNodeId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteNodeAndDescendants]);

  if (!nodes) {
    return null;
  }

  const nodesList = Array.from(nodes.values());

  return (
    <svg
      ref={svgRef}
      data-testid="mind-map-canvas"
      style={{ width: "100vw", height: "100vh", background: "#f8fafc" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Draw edges first so they are behind nodes */}
      {nodesList.map((node) => {
        if (!node.parentId) return null;
        const parent = nodes.get(node.parentId);
        if (!parent) return null;

        return (
          <line
            key={`edge-${node.id}`}
            data-testid="mind-map-edge"
            data-parent-id={node.parentId}
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

      {/* Draw nodes */}
      {nodesList.map((node) => (
        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
          <circle
            data-testid="mind-map-node"
            data-node-id={node.id}
            r={40}
            fill={selectedNodeId === node.id ? "#bae6fd" : "#e0f2fe"}
            stroke={selectedNodeId === node.id ? "#0284c7" : "#38bdf8"}
            strokeWidth={2}
            style={{ cursor: "pointer", pointerEvents: "all" }}
          />
          <text
            data-testid="mind-map-label"
            data-node-id={node.id}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
