// Liveblocks global type augmentation.
declare global {
  interface Liveblocks {
    UserMeta: {
      id: string;
      info?: {
        name?: string;
        avatar?: string;
      };
    };
    ThreadMetadata: {};
  }
}

export {};
