"use strict";
// Re-export everything from the real prosemirror-view and add
// __serializeForClipboard which was removed in v1.34+ but is still
// referenced by @blocknote/core 0.23.x
const pmView = require("./node_modules/prosemirror-view/dist/index.cjs");
const { DOMSerializer } = require("./node_modules/prosemirror-model/dist/index.cjs");

module.exports = {
  ...pmView,
  __serializeForClipboard: function(view, slice) {
    const schema = view.state.schema;
    const serializer =
      (view.someProp && view.someProp("clipboardSerializer")) ||
      DOMSerializer.fromSchema(schema);
    const wrapper = document.createElement("div");
    serializer.serializeFragment(slice.content, { document }, wrapper);
    let text = "";
    wrapper.childNodes.forEach(function(n) {
      if (n.textContent) text += n.textContent + "\n";
    });
    return { dom: wrapper, text: text.trimEnd() };
  },
};
