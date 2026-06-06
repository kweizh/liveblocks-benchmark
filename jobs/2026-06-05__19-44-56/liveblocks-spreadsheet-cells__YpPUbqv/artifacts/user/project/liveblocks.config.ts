import type { LiveMap } from "@liveblocks/client";

export type Presence = {
  editingCell: string | null;
};

export type Storage = {
  cells: LiveMap<string, string>;
};

export type UserMeta = {
  id?: string;
  info?: { name?: string };
};

declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: Storage;
    UserMeta: UserMeta;
  }
}

export const CELL_LABELS: string[] = (() => {
  const labels: string[] = [];
  for (const col of ["A", "B", "C", "D", "E"]) {
    for (const row of [1, 2, 3, 4, 5]) {
      labels.push(`${col}${row}`);
    }
  }
  return labels;
})();
