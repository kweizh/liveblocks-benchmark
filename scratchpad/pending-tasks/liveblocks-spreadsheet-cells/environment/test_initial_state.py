"""Initial-state checks for the liveblocks-spreadsheet-cells task.

These tests confirm that the scaffold is in place before the executor begins:
- Node.js / npm are available.
- /home/user/project exists and contains a Next.js + Liveblocks project.
- liveblocks.config.ts is present with global types declared.
- The app page already renders a 5x5 grid of cells with data-cell labels A1..E5.
- Cell editing logic, presence-based remote editing indicator, and formula
  evaluation are NOT yet implemented (these are what the executor must add).
- Dependencies are pre-installed (node_modules exists, Playwright Chromium too).
"""

import json
import os
import re
import shutil

import pytest

PROJECT_DIR = "/home/user/project"


def _read(rel_path: str) -> str:
    full = os.path.join(PROJECT_DIR, rel_path)
    assert os.path.isfile(full), f"Required file {full} does not exist."
    with open(full, "r", encoding="utf-8") as f:
        return f.read()


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists_and_has_liveblocks_and_next():
    pkg_raw = _read("package.json")
    pkg = json.loads(pkg_raw)
    deps = {}
    deps.update(pkg.get("dependencies", {}) or {})
    deps.update(pkg.get("devDependencies", {}) or {})
    assert "next" in deps, "next is not declared in package.json dependencies."
    assert "@liveblocks/client" in deps, "@liveblocks/client is not declared in package.json dependencies."
    assert "@liveblocks/react" in deps, "@liveblocks/react is not declared in package.json dependencies."


def test_node_modules_preinstalled():
    nm = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(nm), "node_modules is not present; dependencies must be pre-installed."
    assert os.path.isdir(os.path.join(nm, "next")), "next package not installed in node_modules."
    assert os.path.isdir(os.path.join(nm, "@liveblocks", "client")), "@liveblocks/client not installed in node_modules."
    assert os.path.isdir(os.path.join(nm, "@liveblocks", "react")), "@liveblocks/react not installed in node_modules."


def test_liveblocks_config_present():
    content = _read("liveblocks.config.ts")
    assert "Presence" in content, "liveblocks.config.ts should declare a Presence type."
    assert "Storage" in content, "liveblocks.config.ts should declare a Storage type."
    assert "LiveMap" in content, "liveblocks.config.ts should reference LiveMap for the cells storage."


def test_scaffold_renders_25_cells_statically():
    """The scaffold must already define labels for every cell A1..E5.

    We do a static check on either app/page.tsx, app/Spreadsheet.tsx, or
    components/Spreadsheet.tsx so the executor only has to add the dynamic
    behaviour, not the grid scaffolding itself.
    """
    candidates = [
        "app/page.tsx",
        "app/Spreadsheet.tsx",
        "components/Spreadsheet.tsx",
        "app/spreadsheet.tsx",
    ]
    contents = []
    for c in candidates:
        p = os.path.join(PROJECT_DIR, c)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8") as f:
                contents.append(f.read())
    assert contents, "Expected at least one of the spreadsheet scaffold files to exist."
    blob = "\n".join(contents)
    expected_labels = [f"{col}{row}" for col in "ABCDE" for row in "12345"]
    missing = [lab for lab in expected_labels if lab not in blob]
    assert not missing, f"Scaffold is missing cell labels: {missing}"


def test_scaffold_data_cell_attribute_present():
    """The grid scaffold must already expose data-cell attributes on cell nodes."""
    candidates = [
        os.path.join(PROJECT_DIR, "app/page.tsx"),
        os.path.join(PROJECT_DIR, "app/Spreadsheet.tsx"),
        os.path.join(PROJECT_DIR, "components/Spreadsheet.tsx"),
        os.path.join(PROJECT_DIR, "app/spreadsheet.tsx"),
    ]
    blob = ""
    for p in candidates:
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8") as f:
                blob += f.read() + "\n"
    assert "data-cell" in blob, "Scaffold cells must already include a data-cell attribute."


def test_editing_logic_not_yet_implemented():
    """Editing should NOT be wired up yet — that is the executor's job."""
    blob = ""
    for root, _dirs, files in os.walk(os.path.join(PROJECT_DIR, "app")):
        for name in files:
            if name.endswith((".ts", ".tsx", ".js", ".jsx")):
                with open(os.path.join(root, name), "r", encoding="utf-8") as f:
                    blob += f.read() + "\n"
    components_dir = os.path.join(PROJECT_DIR, "components")
    if os.path.isdir(components_dir):
        for root, _dirs, files in os.walk(components_dir):
            for name in files:
                if name.endswith((".ts", ".tsx", ".js", ".jsx")):
                    with open(os.path.join(root, name), "r", encoding="utf-8") as f:
                        blob += f.read() + "\n"
    assert "useMutation" not in blob, (
        "Scaffold must NOT already wire up useMutation; that's part of the task."
    )
    # The scaffold may render the cells via useStorage suspense, but it must not
    # already drive cell writes — checked above. Formula support must be absent.
    assert "SUM(" not in blob.upper().replace(" ", ""), (
        "Scaffold must NOT already implement a SUM formula evaluator."
    )


def test_remote_editing_indicator_not_yet_implemented():
    blob = ""
    for root, _dirs, files in os.walk(PROJECT_DIR):
        # Skip node_modules and .next
        rel = os.path.relpath(root, PROJECT_DIR)
        if rel.startswith("node_modules") or rel.startswith(".next"):
            continue
        for name in files:
            if name.endswith((".ts", ".tsx", ".js", ".jsx")):
                with open(os.path.join(root, name), "r", encoding="utf-8") as f:
                    blob += f.read() + "\n"
    assert "data-remote-editing" not in blob, (
        "Scaffold must NOT already implement the data-remote-editing indicator."
    )


def test_playwright_chromium_installed():
    # The Dockerfile installs Playwright + Chromium so the final-state verifier
    # can drive two browser contexts. We check the cache directory.
    home_cache = os.path.expanduser("~/.cache/ms-playwright")
    root_cache = "/root/.cache/ms-playwright"
    user_cache = "/home/user/.cache/ms-playwright"
    candidates = [home_cache, root_cache, user_cache]
    found = [c for c in candidates if os.path.isdir(c) and os.listdir(c)]
    assert found, f"Playwright Chromium cache not found in any of {candidates}."


def test_env_keys_are_set():
    """The harness injects real Liveblocks credentials at runtime."""
    for key in (
        "LIVEBLOCKS_SECRET_KEY",
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY",
        "ZEALT_RUN_ID",
    ):
        assert os.environ.get(key), f"Required env var {key} is not set."
