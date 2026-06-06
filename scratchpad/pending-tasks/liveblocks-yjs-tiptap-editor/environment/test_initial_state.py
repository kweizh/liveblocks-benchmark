import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json missing at {pkg_path}."


def test_package_json_has_required_dependencies():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})

    required = [
        "next",
        "react",
        "react-dom",
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
        "@liveblocks/yjs",
        "yjs",
        "@tiptap/react",
        "@tiptap/pm",
        "@tiptap/starter-kit",
        "@tiptap/extension-collaboration",
        "@tiptap/extension-collaboration-cursor",
    ]
    missing = [pkg_name for pkg_name in required if pkg_name not in deps]
    assert not missing, f"package.json is missing required dependencies: {missing}"


def test_node_modules_installed():
    nm_path = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm_path), (
        f"node_modules directory not found at {nm_path}; dependencies must be pre-installed."
    )


def test_room_route_scaffold_exists():
    # The dynamic [roomId] route file under the App Router should exist as a scaffold.
    candidates = [
        os.path.join(PROJECT_DIR, "app", "r", "[roomId]", "page.tsx"),
        os.path.join(PROJECT_DIR, "app", "r", "[roomId]", "page.jsx"),
        os.path.join(PROJECT_DIR, "src", "app", "r", "[roomId]", "page.tsx"),
        os.path.join(PROJECT_DIR, "src", "app", "r", "[roomId]", "page.jsx"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        f"Scaffolded /r/[roomId] route page not found. Looked for: {candidates}"
    )


def test_liveblocks_auth_route_exists():
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.js"),
        os.path.join(PROJECT_DIR, "src", "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "src", "app", "api", "liveblocks-auth", "route.js"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        f"Scaffolded /api/liveblocks-auth route not found. Looked for: {candidates}"
    )


def _read_text_recursively(root):
    chunks = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip large/irrelevant directories
        dirnames[:] = [
            d for d in dirnames
            if d not in {"node_modules", ".next", ".git", "out", "dist"}
        ]
        for name in filenames:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            try:
                with open(os.path.join(dirpath, name), encoding="utf-8", errors="ignore") as f:
                    chunks.append(f.read())
            except OSError:
                continue
    return "\n".join(chunks)


def test_collaboration_extension_not_yet_wired():
    """The Tiptap Collaboration extension must NOT be imported in the scaffold yet."""
    source = _read_text_recursively(PROJECT_DIR)
    assert "@tiptap/extension-collaboration\"" not in source and \
        "from \"@tiptap/extension-collaboration\"" not in source and \
        "from '@tiptap/extension-collaboration'" not in source, (
        "Initial scaffold should NOT yet import @tiptap/extension-collaboration."
    )


def test_collaboration_cursor_extension_not_yet_wired():
    """The Tiptap CollaborationCursor extension must NOT be imported in the scaffold yet."""
    source = _read_text_recursively(PROJECT_DIR)
    assert "from \"@tiptap/extension-collaboration-cursor\"" not in source and \
        "from '@tiptap/extension-collaboration-cursor'" not in source, (
        "Initial scaffold should NOT yet import @tiptap/extension-collaboration-cursor."
    )


def test_yjs_provider_not_yet_wired():
    """The Liveblocks Yjs provider must NOT be imported in the scaffold yet."""
    source = _read_text_recursively(PROJECT_DIR)
    assert "from \"@liveblocks/yjs\"" not in source and \
        "from '@liveblocks/yjs'" not in source, (
        "Initial scaffold should NOT yet import @liveblocks/yjs."
    )


def test_starter_kit_already_wired():
    """The scaffold should already include the base Tiptap StarterKit so the editor renders."""
    source = _read_text_recursively(PROJECT_DIR)
    assert "@tiptap/starter-kit" in source, (
        "Initial scaffold should already wire up @tiptap/starter-kit for a basic editor."
    )
