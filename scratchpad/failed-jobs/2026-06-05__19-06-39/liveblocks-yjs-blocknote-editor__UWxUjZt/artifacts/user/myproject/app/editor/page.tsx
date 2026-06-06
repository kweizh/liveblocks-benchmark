import EditorClient from "./EditorClient";

export default function EditorPage() {
  const defaultRoomId = process.env.ZEALT_RUN_ID
    ? `blocknote-${process.env.ZEALT_RUN_ID}`
    : "blocknote-default";

  return <EditorClient defaultRoomId={defaultRoomId} />;
}
