// Liveblocks global type augmentation.
// The executor is expected to extend `ThreadMetadata` so that threads
// can be marked as resolved via custom metadata.
declare global {
  interface Liveblocks {
    UserMeta: {
      id: string;
      info?: {
        name?: string;
        color?: string;
      };
    };
    // NOTE: Initial scaffold leaves ThreadMetadata empty on purpose.
    ThreadMetadata: {};
  }
}

export {};
