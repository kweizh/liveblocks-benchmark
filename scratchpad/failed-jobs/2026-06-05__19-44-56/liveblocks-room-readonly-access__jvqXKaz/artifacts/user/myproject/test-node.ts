import { Liveblocks } from "@liveblocks/node";
const lb = new Liveblocks({ secret: "sk_test_123" });
const session = lb.prepareSession("user1");
session.allow("room1", session.READ_ACCESS);
async function test() {
  const { status, body } = await session.authorize();
  console.log(typeof body);
}
test();
