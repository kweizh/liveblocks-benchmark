import dynamic from "next/dynamic";

// Load canvas client-side only (uses browser APIs)
const MindMapCanvas = dynamic(() => import("../components/MindMapCanvas"), {
  ssr: false,
  loading: () => (
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
      Loading…
    </div>
  ),
});

export default function Page() {
  return (
    <main style={{ margin: 0, padding: 0, overflow: "hidden" }}>
      <MindMapCanvas />
    </main>
  );
}
