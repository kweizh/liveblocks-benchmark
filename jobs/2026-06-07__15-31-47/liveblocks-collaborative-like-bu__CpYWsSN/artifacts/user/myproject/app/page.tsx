import { Room } from "./Room";
import { LikeButton } from "./LikeButton";

export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
      <h1>Collaborative Like Button</h1>
      <Room>
        <LikeButton />
      </Room>
    </main>
  );
}
