const { LiveList } = require("@liveblocks/client");
const list = new LiveList(["a", "b", "c"]);
console.log(typeof list.findIndex);
console.log(list.findIndex(x => x === "b"));
