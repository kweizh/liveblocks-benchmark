import { Room } from "./Room";
import { Canvas } from "./Canvas";
import { AvatarList } from "./AvatarList";

export default function Page() {
  return (
    <Room>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AvatarList />
        <Canvas />
      </div>
    </Room>
  );
}
