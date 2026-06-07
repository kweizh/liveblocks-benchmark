declare global {
  interface Liveblocks {
    // Custom user metadata for threads
    ThreadMetadata: {
      resolved?: boolean;
    };
  }
}

export {};
