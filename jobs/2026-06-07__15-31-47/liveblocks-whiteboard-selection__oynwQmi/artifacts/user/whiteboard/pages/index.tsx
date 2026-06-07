import { useEffect } from "react";
import { LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  useMutation,
  useMyPresence,
  useOthers,
  useStorage,
} from "@liveblocks/react";

type SeedShape = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

const SEED_SHAPES: SeedShape[] = [
  { id: "shape-a", x: 80,  y: 80,  width: 140, height: 90,  fill: "#FCD34D" },
  { id: "shape-b", x: 320, y: 200, width: 140, height: 140, fill: "#A78BFA" },
  { id: "shape-c", x: 560, y: 360, width: 160, height: 100, fill: "#34D399" },
];

// A small fixed palette for fallback per-connectionId colors
const PALETTE = [
  "#DC2626", "#2563EB", "#059669", "#D97706", "#7C3AED",
  "#DB2777", "#0891B2", "#65A30D", "#EA580C", "#4F46E5",
];

function getColorForConnectionId(connectionId: number): string {
  return PALETTE[connectionId % PALETTE.length];
}

function Whiteboard() {
  const shapes = useStorage((root) => root.shapes);
  const others = useOthers();
  const [, updateMyPresence] = useMyPresence();

  const seedShapes = useMutation(({ storage }) => {
    const list = storage.get("shapes");
    if (list.length === 0) {
      for (const s of SEED_SHAPES) {
        list.push(new LiveObject(s));
      }
    }
  }, []);

  useEffect(() => {
    if (shapes && shapes.length === 0) {
      seedShapes();
    }
  }, [shapes, seedShapes]);

  if (!shapes) {
    return <div>Loading…</div>;
  }

  function handleShapeClick(
    e: React.MouseEvent<SVGRectElement>,
    shapeId: string
  ) {
    e.stopPropagation();
    updateMyPresence({ selectedShapeId: shapeId });
  }

  function handleSvgClick() {
    updateMyPresence({ selectedShapeId: null });
  }

  return (
    <svg
      viewBox="0 0 800 600"
      width="100%"
      height="100vh"
      style={{ background: "#f8fafc", display: "block" }}
      onClick={handleSvgClick}
    >
      {shapes.map((shape) => {
        // Collect all other users who have selected this shape
        const selectingOthers = others.filter(
          (other) => other.presence.selectedShapeId === shape.id
        );

        return (
          <g key={shape.id}>
            {/* The shape itself */}
            <rect
              data-testid="shape"
              data-shape-id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleShapeClick(e, shape.id)}
            />
            {/* Selection rings – one per other user selecting this shape */}
            {selectingOthers.map((other, idx) => {
              const ringColor: string =
                (other.presence.color as string | undefined) ||
                (other.info?.color as string | undefined) ||
                getColorForConnectionId(other.connectionId);
              const offset = 4 + idx * 4;
              return (
                <rect
                  key={other.connectionId}
                  data-testid="selection-ring"
                  data-selection-shape-id={shape.id}
                  data-selection-connection-id={String(other.connectionId)}
                  data-selection-color={ringColor}
                  x={shape.x - offset}
                  y={shape.y - offset}
                  width={shape.width + offset * 2}
                  height={shape.height + offset * 2}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={3}
                  style={{ pointerEvents: "none" }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function Page() {
  return (
    <ClientSideSuspense fallback={<div>Loading…</div>}>
      {() => <Whiteboard />}
    </ClientSideSuspense>
  );
}
