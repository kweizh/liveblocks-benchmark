"""Initial-state verification for the liveblocks-shared-stopwatch task.

These tests confirm that the Next.js + Liveblocks scaffolding required by the
task is already in place BEFORE the executor begins work, and that the
Storage-backed stopwatch behaviour is NOT YET implemented.
"""

import json
import os
import shutil


PROJECT_DIR = "/home/user/project"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
APP_DIR = os.path.join(PROJECT_DIR, "app")
AUTH_ROUTE = os.path.join(APP_DIR, "api", "liveblocks-auth", "route.ts")
HOME_PAGE = os.path.join(APP_DIR, "page.tsx")
LIVEBLOCKS_CONFIG = os.path.join(PROJECT_DIR, "liveblocks.config.ts")


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


def test_home_page_skeleton_exists():
    assert os.path.isfile(HOME_PAGE), (
        f"Expected home page skeleton at {HOME_PAGE}."
    )


def test_liveblocks_auth_route_exists():
    assert os.path.isfile(AUTH_ROUTE), (
        f"Expected Liveblocks auth route at {AUTH_ROUTE}."
    )


def test_liveblocks_config_skeleton_exists():
    assert os.path.isfile(LIVEBLOCKS_CONFIG), (
        f"Expected liveblocks.config.ts at {LIVEBLOCKS_CONFIG}."
    )


def test_stopwatch_storage_not_yet_implemented():
    """The executor must add Storage mutation logic.

    The starter home page must NOT yet contain Liveblocks Storage mutation
    primitives, so we check that the page does not yet reference
    `useMutation` or write to `Storage.stopwatch`.
    """
    with open(HOME_PAGE) as f:
        source = f.read()
    forbidden_markers = (
        "useMutation",
        "storage.get(\"stopwatch\")",
        "storage.get('stopwatch')",
        "new LiveObject(",
    )
    for marker in forbidden_markers:
        assert marker not in source, (
            f"Initial home page skeleton already contains '{marker}'. "
            "Storage mutations must be implemented by the executor."
        )
    assert "TODO" in source or "todo" in source.lower(), (
        "Expected the home page skeleton to contain a TODO marker so the "
        "executor knows where to implement Storage mutations."
    )


def test_initial_state_does_not_render_stopwatch_dom_contract():
    """The required DOM ids must be added by the executor."""
    with open(HOME_PAGE) as f:
        source = f.read()
    for dom_id in (
        "stopwatch-start",
        "stopwatch-stop",
        "stopwatch-reset",
        "stopwatch-state",
        "stopwatch-elapsed-ms",
    ):
        assert f'id="{dom_id}"' not in source, (
            f"Initial skeleton must not pre-render stopwatch UI (id={dom_id})."
        )
