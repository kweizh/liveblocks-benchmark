const { Liveblocks } = require('@liveblocks/node');
const liveblocks = new Liveblocks({
  secret: 'sk_test_123',
});

async function test() {
  const { status, body } = await liveblocks.identifyUser(
    {
      userId: "user_123",
      groupIds: [],
    },
    { userInfo: {} }
  );
  console.log(status, body);
}
test();
