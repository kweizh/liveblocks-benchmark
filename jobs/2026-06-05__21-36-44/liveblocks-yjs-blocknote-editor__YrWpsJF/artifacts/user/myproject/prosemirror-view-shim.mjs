// Shim that re-exports everything from prosemirror-view and adds the
// __serializeForClipboard export that @blocknote/core 0.23.x requires.
// We import directly from the dist file to avoid a circular alias.
export {
  Decoration,
  DecorationSet,
  EditorView,
  __endComposition,
  __parseFromClipboard,
} from "./node_modules/prosemirror-view/dist/index.js";

// Reconstruct a compatible __serializeForClipboard using DOMSerializer.
// prosemirror-view >=1.34 removed this export; BlockNote still depends on it.
import { DOMSerializer } from "prosemirror-model";

export function __serializeForClipboard(view, slice) {
  const schema = view.state.schema;
  const serializer =
    (view.someProp && view.someProp("clipboardSerializer")) ||
    DOMSerializer.fromSchema(schema);
  const wrapper = document.createElement("div");
  serializer.serializeFragment(slice.content, { document }, wrapper);
  let text = "";
  wrapper.childNodes.forEach((n) => {
    if (n.textContent) text += n.textContent + "\n";
  });
  return { dom: wrapper, text: text.trimEnd() };
}
