const { LiveList } = require("@liveblocks/client");
const list = new LiveList(["a", "b", "c"]);
console.log(typeof list.find);
