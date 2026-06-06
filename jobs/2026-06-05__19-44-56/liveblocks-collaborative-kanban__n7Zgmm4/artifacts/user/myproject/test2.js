const { LiveList, LiveObject, LiveMap } = require("@liveblocks/client");
const cards = new LiveMap();
cards.set("a", new LiveObject({ title: "Hello" }));
console.log(cards.get("a").get("title"));
