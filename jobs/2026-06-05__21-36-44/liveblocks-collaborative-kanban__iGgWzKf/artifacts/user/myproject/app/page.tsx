import { Room } from "./Room";
import { KanbanBoard } from "./KanbanBoard";

export default function KanbanPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Collaborative Kanban</h1>
      <Room>
        <KanbanBoard />
      </Room>
    </main>
  );
}
