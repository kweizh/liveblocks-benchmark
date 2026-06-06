"""Initial-state verification for the liveblocks-history-undo-redo task.

These tests confirm that the Next.js + Liveblocks scaffolding required by the
task is already in place BEFORE the executor begins work, and that the
history (undo / redo / pause / resume) hooks are NOT YET wired up.
"""

import json
import os
import shutil


PROJECT_DIR = "/home/user/project"
PACKAGE_JSON = os.path.join(PROJECT_DIR, "package.json")
APP_DIR = os.path.join(PROJECT_DIR, "app")
PALETTE_DIR = os.path.join(APP_DIR, "palette", "[room]")
PALETTE_PAGE = os.path.join(PALETTE_DIR, "page.tsx")
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


def test_palette_route_skeleton_exists():
    assert os.path.isdir(PALETTE_DIR), (
        f"Expected palette route directory at {PALETTE_DIR}."
    )
    assert os.path.isfile(PALETTE_PAGE), (
        f"Expected palette page skeleton at {PALETTE_PAGE}."
    )


def test_liveblocks_auth_route_exists():
    assert os.path.isfile(AUTH_ROUTE), (
        f"Expected Liveblocks auth route at {AUTH_ROUTE}."
    )


def test_liveblocks_config_skeleton_exists():
    assert os.path.isfile(LIVEBLOCKS_CONFIG), (
        f"Expected liveblocks.config.ts at {LIVEBLOCKS_CONFIG}."
    )


def test_storage_schema_already_uses_livelist_palette():
    """Storage type already exposes `palette: LiveList<string>` for the executor."""
    config_src = _read(LIVEBLOCKS_CONFIG)
    assert "palette" in config_src, (
        "Expected liveblocks.config.ts to declare a `palette` storage entry."
    )
    assert "LiveList" in config_src, (
        "Expected liveblocks.config.ts to declare `LiveList` as the palette type."
    )


def test_palette_page_already_renders_add_form():
    """The starter must already render the add/delete/edit UI scaffolding."""
    src = _read(PALETTE_PAGE)
    for testid in (
        "new-color-input",
        "add-color",
        "palette-row",
        "color-label",
        "color-edit-input",
        "color-save",
        "color-delete",
    ):
        assert f'data-testid="{testid}"' in src, (
            f"Expected the starter palette page to already render the "
            f"DOM contract for `{testid}`."
        )


def test_palette_page_does_not_wire_history_hooks_yet():
    """The executor must wire undo/redo/pause/resume; it must not be pre-wired."""
    src = _read(PALETTE_PAGE)
    forbidden = (
        "useUndo",
        "useRedo",
        "useCanUndo",
        "useCanRedo",
        "useHistory",
        ".pause(",
        ".resume(",
        'data-testid="undo-btn"',
        'data-testid="redo-btn"',
        'data-testid="drag-edit"',
    )
    for marker in forbidden:
        assert marker not in src, (
            f"Initial palette page already references `{marker}`. "
            "The history wiring must be added by the executor."
        )
    assert "TODO" in src or "todo" in src.lower(), (
        "Expected the palette page skeleton to include a TODO marker so the "
        "executor knows where to wire up the history hooks."
    )
