import os
import shutil


PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_liveblocks_secret_key_env():
    assert os.environ.get("LIVEBLOCKS_SECRET_KEY"), (
        "LIVEBLOCKS_SECRET_KEY environment variable is not set."
    )


def test_liveblocks_public_key_env():
    assert os.environ.get("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY"), (
        "NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY environment variable is not set."
    )


def test_zealt_run_id_env():
    assert os.environ.get("ZEALT_RUN_ID"), (
        "ZEALT_RUN_ID environment variable is not set."
    )
