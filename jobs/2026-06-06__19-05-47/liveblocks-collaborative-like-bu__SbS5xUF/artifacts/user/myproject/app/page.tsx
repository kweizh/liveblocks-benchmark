import LikeButton from "./LikeButton";

export const metadata = {
  title: "Liveblocks Like Button",
  description: "Collaborative like button using Liveblocks Storage",
};

export default function Home() {
  return (
    <main>
      <h1>Liveblocks Like Button</h1>
      <LikeButton />
    </main>
  );
}