import { LiveMap } from "@liveblocks/client";
import { useStorage, useMutation } from "@liveblocks/react";

declare global {
  interface Liveblocks {
    Storage: {
      votes: LiveMap<string, number>;
    };
  }
}

export { useStorage, useMutation };
