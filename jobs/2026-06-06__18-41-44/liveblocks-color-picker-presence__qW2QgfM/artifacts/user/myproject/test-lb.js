const { Liveblocks } = require('@liveblocks/node');
const lb = new Liveblocks({ secret: "sk_test_123" });
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(lb)));
