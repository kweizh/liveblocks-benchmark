"""Initial-state verification for the liveblocks-emoji-reaction-broadcast task.

These tests confirm that the Next.js + Liveblocks scaffolding required by the
task is already in place BEFORE the executor begins work, and that the
broadcast / event-listener wiring is NOT YET implemented on the reactions page.
"""

import json
import os
import shutil


PROJECT_DIR = "/home/user/project"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
APP_DIR = os.path.join(PROJECT_DIR, "app")
REACTIONS_DIR = os.path.join(APP_DIR, "reactions", "[room]")
REACTIONS_PAGE = os.path.join(REACTIONS_DIR, "page.tsx")
AUTH_ROUTE = os.path.join(APP_DIR, "api", "liveblocks-auth", "route.ts")
LIVEBLOCKS_CONFIG = os.path.join(PROJECT_DIR, "liveblocks.config.ts")


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_package_json_exists():
    assert os.path.isfile(PACKAGE_JSON), (
        f"package.json not found at {PACKAGE_JSON}."
    )


def test_package_json_declares_liveblocks_dependencies():
    with open(PACKAGE_JSON) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies") or {})
    deps.update(pkg.get("devDependencies") or {})
    for required in (
        "next",
        "react",
        "react-dom",
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
    ):
        assert required in deps, (
            f"Expected {required} to be listed in package.json dependencies."
        )


def test_node_modules_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"Expected pre-installed node_modules at {node_modules}."
    )
    for pkg in (
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
        "next",
    ):
        assert os.path.isdir(os.path.join(node_modules, pkg)), (
            f"Expected {pkg} to be pre-installed under node_modules."
        )


def test_reactions_route_skeleton_exists():
    assert os.path.isdir(REACTIONS_DIR), (
        f"Expected reactions route directory at {REACTIONS_DIR}."
    )
    assert os.path.isfile(REACTIONS_PAGE), (
        f"Expected reactions page skeleton at {REACTIONS_PAGE}."
    )


def test_liveblocks_auth_route_exists():
    assert os.path.isfile(AUTH_ROUTE), (
        f"Expected Liveblocks auth route at {AUTH_ROUTE}."
    )


def test_liveblocks_config_exists():
    assert os.path.isfile(LIVEBLOCKS_CONFIG), (
        f"Expected liveblocks.config.ts at {LIVEBLOCKS_CONFIG}."
    )


def test_reactions_page_does_not_wire_broadcast_yet():
    """The executor must wire useBroadcastEvent / useEventListener; it must not be pre-wired."""
    src = _read(REACTIONS_PAGE)
    forbidden = (
        "useBroadcastEvent",
        "useEventListener",
    )
    for marker in forbidden:
        assert marker not in src, (
            f"Initial reactions page already references `{marker}`. "
            "The broadcast / listener wiring must be added by the executor."
        )
    assert "TODO" in src or "todo" in src.lower(), (
        "Expected the reactions page skeleton to include a TODO marker so the "
        "executor knows where to wire up the broadcast hooks."
    )
