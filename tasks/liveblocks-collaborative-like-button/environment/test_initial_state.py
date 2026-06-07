import os
import shutil

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Expected project directory {PROJECT_DIR} to exist before task starts."
    )


def test_package_json_exists():
    pkg = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg), (
        f"Expected {pkg} to exist (Next.js project should be scaffolded)."
    )


def test_node_modules_present():
    node_modules = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules), (
        f"Expected {node_modules} directory (dependencies should be installed)."
    )


def test_liveblocks_react_installed():
    pkg = os.path.join(PROJECT_DIR, "node_modules", "@liveblocks", "react", "package.json")
    assert os.path.isfile(pkg), (
        "Expected @liveblocks/react to be installed in node_modules."
    )


def test_liveblocks_client_installed():
    pkg = os.path.join(PROJECT_DIR, "node_modules", "@liveblocks", "client", "package.json")
    assert os.path.isfile(pkg), (
        "Expected @liveblocks/client to be installed in node_modules."
    )


def test_next_installed():
    pkg = os.path.join(PROJECT_DIR, "node_modules", "next", "package.json")
    assert os.path.isfile(pkg), (
        "Expected next to be installed in node_modules."
    )


def test_liveblocks_public_key_env_present():
    assert os.environ.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"), (
        "Expected NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY env var to be present."
    )


def test_liveblocks_secret_key_env_present():
    assert os.environ.get("LIVEBLOCKS_SECRET_KEY"), (
        "Expected LIVEBLOCKS_SECRET_KEY env var to be present."
    )


def test_zealt_run_id_env_present():
    assert os.environ.get("ZEALT_RUN_ID"), (
        "Expected ZEALT_RUN_ID env var to be present."
    )
