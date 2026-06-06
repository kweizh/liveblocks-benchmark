import json
import os
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_package_json_exists():
    path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(path), f"package.json does not exist at {path}."


def test_package_json_lists_liveblocks_and_next():
    path = os.path.join(PROJECT_DIR, "package.json")
    with open(path) as f:
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
            f"Expected dependency '{required}' to be declared in package.json."
        )


def test_node_modules_preinstalled():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"node_modules directory not found at {node_modules}; dependencies must be pre-installed."
    )
    for required in ("next", "@liveblocks/client", "@liveblocks/react", "@liveblocks/node"):
        assert os.path.isdir(os.path.join(node_modules, required)), (
            f"Pre-installed dependency '{required}' not found inside node_modules."
        )


def test_liveblocks_config_skeleton_exists():
    path = os.path.join(PROJECT_DIR, "liveblocks.config.ts")
    assert os.path.isfile(path), (
        f"liveblocks.config.ts skeleton must exist at {path}."
    )


def test_poll_page_skeleton_exists():
    page_path = os.path.join(PROJECT_DIR, "app", "page.tsx")
    assert os.path.isfile(page_path), (
        f"Poll page skeleton must exist at {page_path}."
    )


def test_auth_route_skeleton_exists():
    route_path = os.path.join(
        PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"
    )
    assert os.path.isfile(route_path), (
        f"Liveblocks auth route skeleton must exist at {route_path}."
    )


def test_voting_logic_not_yet_implemented():
    """The scaffold must not already contain the percentage/total-votes logic."""
    page_path = os.path.join(PROJECT_DIR, "app", "page.tsx")
    with open(page_path) as f:
        contents = f.read()
    forbidden_markers = [
        'data-testid="total-votes"',
        'data-testid="bar-',
        'data-testid="vote-',
    ]
    for marker in forbidden_markers:
        assert marker not in contents, (
            f"Scaffold must not already implement voting UI; found '{marker}' in page.tsx."
        )


def test_next_config_present():
    found = False
    for candidate in ("next.config.js", "next.config.mjs", "next.config.ts"):
        if os.path.isfile(os.path.join(PROJECT_DIR, candidate)):
            found = True
            break
    assert found, "A next.config.{js,mjs,ts} file is required at the project root."
