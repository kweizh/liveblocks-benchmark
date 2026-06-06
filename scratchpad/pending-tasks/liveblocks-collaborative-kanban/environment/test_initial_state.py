import json
import os
import re
import shutil

import pytest

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"package.json not found at {pkg_path}."


def test_package_json_has_liveblocks_deps():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = {}
    deps.update(pkg.get("dependencies", {}))
    deps.update(pkg.get("devDependencies", {}))
    for required in [
        "@liveblocks/client",
        "@liveblocks/react",
        "@liveblocks/node",
        "next",
        "react",
        "react-dom",
    ]:
        assert required in deps, f"Expected dependency '{required}' in package.json."


def test_node_modules_pre_installed():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"node_modules must be pre-installed at {node_modules}."
    )
    # Spot check a couple of Liveblocks packages
    for pkg in ["@liveblocks/client", "@liveblocks/react", "@liveblocks/node", "next"]:
        path = os.path.join(node_modules, *pkg.split("/"))
        assert os.path.isdir(path), (
            f"Expected pre-installed dependency directory {path}."
        )


def test_liveblocks_config_exists():
    # The scaffold must provide a liveblocks.config.ts file users can extend.
    candidates = [
        os.path.join(PROJECT_DIR, "liveblocks.config.ts"),
        os.path.join(PROJECT_DIR, "src", "liveblocks.config.ts"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        "liveblocks.config.ts must exist in the project root or src/."
    )


def test_auth_route_file_exists():
    # The scaffold provides a placeholder auth route for /api/liveblocks-auth.
    candidates = [
        os.path.join(PROJECT_DIR, "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "src", "app", "api", "liveblocks-auth", "route.ts"),
        os.path.join(PROJECT_DIR, "pages", "api", "liveblocks-auth.ts"),
    ]
    assert any(os.path.isfile(p) for p in candidates), (
        "Liveblocks auth API route file must exist in the scaffold."
    )


def test_page_renders_three_columns_placeholder():
    # The scaffold must already render the three column titles (To Do, In Progress, Done)
    # so the initial-state UI test passes — but it must NOT yet contain the CRUD logic.
    page_candidates = [
        os.path.join(PROJECT_DIR, "app", "page.tsx"),
        os.path.join(PROJECT_DIR, "app", "page.jsx"),
        os.path.join(PROJECT_DIR, "src", "app", "page.tsx"),
        os.path.join(PROJECT_DIR, "src", "app", "page.jsx"),
        os.path.join(PROJECT_DIR, "pages", "index.tsx"),
        os.path.join(PROJECT_DIR, "pages", "index.jsx"),
    ]
    found = None
    for p in page_candidates:
        if os.path.isfile(p):
            found = p
            break
    assert found is not None, "No Next.js page entry file found in the scaffold."
    with open(found) as f:
        content = f.read()
    for title in ["To Do", "In Progress", "Done"]:
        assert title in content, (
            f"Column title '{title}' must appear in the scaffold page {found}."
        )


def _read_all_source_files():
    sources = []
    for root, dirs, files in os.walk(PROJECT_DIR):
        # Skip node_modules and build artifacts
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", ".git", "out", "dist")]
        for name in files:
            if name.endswith((".ts", ".tsx", ".js", ".jsx")):
                path = os.path.join(root, name)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        sources.append((path, f.read()))
                except OSError:
                    continue
    return sources


def test_card_crud_not_yet_implemented():
    # The scaffold must NOT already contain the card CRUD / drag move implementation.
    # No useMutation calls, no LiveMap usage for cards, no drag handlers wiring storage.
    sources = _read_all_source_files()
    assert sources, "No source files found inside the project — scaffold is empty."

    for path, content in sources:
        # Strip block comments and line comments to ignore TODO hints
        without_block = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
        cleaned = re.sub(r"(?m)^\s*//.*$", "", without_block)

        assert "useMutation" not in cleaned, (
            f"Scaffold file {path} must NOT yet call useMutation (card CRUD/move not implemented)."
        )
        assert "new LiveMap" not in cleaned, (
            f"Scaffold file {path} must NOT yet instantiate LiveMap for cards."
        )


def test_env_file_or_example_present():
    # The scaffold must document the required Liveblocks env vars so the agent knows
    # to use the real cloud (no mocking).
    candidates = [
        os.path.join(PROJECT_DIR, ".env.local"),
        os.path.join(PROJECT_DIR, ".env"),
        os.path.join(PROJECT_DIR, ".env.example"),
        os.path.join(PROJECT_DIR, "README.md"),
    ]
    found = False
    for p in candidates:
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            if (
                "LIVEBLOCKS_SECRET_KEY" in text
                and "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY" in text
            ):
                found = True
                break
    assert found, (
        "Expected the scaffold to reference LIVEBLOCKS_SECRET_KEY and "
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY in an env file or README."
    )
