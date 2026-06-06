import { Room } from "./Room";
import { Header } from "./components/Header";

function getRoomId(): string {
  const runId =
    process.env.NEXT_PUBLIC_ZEALT_RUN_ID ?? process.env.ZEALT_RUN_ID ?? "dev";
  return `presence-avatars-${runId}`;
}

export default function Page() {
  const roomId = getRoomId();
  return (
    <Room roomId={roomId}>
      <main>
        <Header />
        <section style={{ padding: 24 }}>
          <h1>Presence Avatars Demo</h1>
          <p>Open this page in multiple tabs to see the avatar stack update.</p>
        </section>
      </main>
    </Room>
  );
}
