declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      color: string;
    };

    // The Storage tree for the room, for useStorage, useMutation, etc.
    Storage: {
      // ...
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        // ...
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener, etc.
    RoomEvent: {};

    // Custom metadata set on threads, for useThreads, etc.
    ThreadMetadata: {
      // ...
    };

    // Custom room info set when authenticating with a secret key
    RoomInfo: {
      // ...
    };
  }
}

export {};
