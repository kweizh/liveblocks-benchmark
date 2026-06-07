import { Providers } from "./providers";
import ColorPicker from "./ColorPicker";

export default function Page() {
  const runId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID || "default-run-id";
  const roomId = `color-picker-${runId}`;
  const hasSecretKey = !!process.env.LIVEBLOCKS_SECRET_KEY;

  return (
    <Providers roomId={roomId} useAuth={hasSecretKey}>
      <ColorPicker />
    </Providers>
  );
}
