import { Room } from "./Room";
import { LikeButton } from "./LikeButton";

export default function Page() {
  return (
    <Room>
      <main>
        <h1>Collaborative Like Button</h1>
        <LikeButton />
      </main>
    </Room>
  );
}
