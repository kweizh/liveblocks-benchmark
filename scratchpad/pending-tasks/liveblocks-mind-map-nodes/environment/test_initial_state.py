"""Initial-state verification for liveblocks-mind-map-nodes.

These checks must pass *before* the executor begins implementing the task.
They guarantee that a Next.js scaffold is in place with Liveblocks installed
but that the collaborative mind-map (node CRUD, drag, recursive delete) has
NOT yet been implemented.
"""

import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
NODE_MODULES = os.path.join(PROJECT_DIR, "node_modules")


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    assert os.path.isfile(PACKAGE_JSON), f"package.json not found at {PACKAGE_JSON}."


def test_package_json_has_nextjs_dependency():
    with open(PACKAGE_JSON) as f:
        data = json.load(f)
    deps = {}
    deps.update(data.get("dependencies", {}) or {})
    deps.update(data.get("devDependencies", {}) or {})
    assert "next" in deps, "Next.js is not listed as a dependency in package.json."


def test_package_json_has_liveblocks_dependencies():
    with open(PACKAGE_JSON) as f:
        data = json.load(f)
    deps = {}
    deps.update(data.get("dependencies", {}) or {})
    deps.update(data.get("devDependencies", {}) or {})
    assert "@liveblocks/client" in deps, "@liveblocks/client is not installed."
    assert "@liveblocks/react" in deps, "@liveblocks/react is not installed."


def test_node_modules_preinstalled():
    assert os.path.isdir(NODE_MODULES), (
        f"node_modules directory not found at {NODE_MODULES}; "
        "dependencies should be pre-installed in the image."
    )
    assert os.path.isdir(os.path.join(NODE_MODULES, "next")), (
        "next is missing from node_modules; dependencies should be pre-installed."
    )
    assert os.path.isdir(os.path.join(NODE_MODULES, "@liveblocks", "client")), (
        "@liveblocks/client is missing from node_modules; "
        "dependencies should be pre-installed."
    )


def test_dev_script_defined():
    with open(PACKAGE_JSON) as f:
        data = json.load(f)
    scripts = data.get("scripts", {}) or {}
    assert "dev" in scripts, "package.json must define a 'dev' script (e.g. 'next dev')."


def _read_repo_text():
    """Read all source files in the project (excluding node_modules / .next)."""
    collected = []
    for root, dirs, files in os.walk(PROJECT_DIR):
        # Skip heavy / vendored dirs
        dirs[:] = [d for d in dirs if d not in {"node_modules", ".next", ".git"}]
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")):
                continue
            path = os.path.join(root, name)
            try:
                with open(path, encoding="utf-8", errors="ignore") as f:
                    collected.append(f.read())
            except OSError:
                continue
    return "\n".join(collected)


def test_mind_map_not_yet_implemented():
    """The mind-map specific behaviours (LiveMap of nodes, recursive delete)
    must NOT exist yet — the executor is responsible for adding them."""
    sources = _read_repo_text()

    # The Storage nodes LiveMap is the core feature of the task; it must not
    # already be wired up.
    forbidden_markers = [
        "mind-map-canvas",
        "mind-map-node",
        "mind-map-edge",
        "mind-map-label",
    ]
    for marker in forbidden_markers:
        assert marker not in sources, (
            f"Found '{marker}' in project sources — the mind-map UI appears to "
            "be partially or fully implemented already. The initial scaffold "
            "must not contain mind-map behaviour."
        )


def test_liveblocks_not_mocked():
    """The executor must use the real Liveblocks cloud; the scaffold must not
    ship a local mock of the Liveblocks client."""
    sources = _read_repo_text()
    suspicious = [
        "mockLiveblocks",
        "mock-liveblocks",
        "fakeLiveblocks",
        "fake-liveblocks",
    ]
    for s in suspicious:
        assert s not in sources, (
            f"Found '{s}' in sources — Liveblocks must not be mocked; the "
            "real Liveblocks cloud must be used."
        )
