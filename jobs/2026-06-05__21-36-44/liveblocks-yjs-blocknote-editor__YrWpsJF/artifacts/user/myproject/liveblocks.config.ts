import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useSelf,
    useOthers,
  },
} = createRoomContext(client);

export { client };
