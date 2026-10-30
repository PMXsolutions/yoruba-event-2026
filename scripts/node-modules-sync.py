#!/usr/bin/env python3
"""Decide whether the Windows deploy must upload node_modules.

Ordinary commits skip that folder. A new upload runs only when the
standalone node_modules tree hash changes. The first full upload is
remembered from the existing FTP sync state so it is not repeated.
"""

import hashlib
import io
import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

HASH_NAME = "node_modules.deploy-hash"
STATE_NAME = ".ftp-deploy-sync-state.json"
SERVER_DIR = "/yorubadayapp"
LOCAL_HASH = Path("/tmp/node_modules.deploy-hash")


def tree_hash(root: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    count = 0
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        relative = path.relative_to(root).as_posix()
        file_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(file_hash.encode())
        digest.update(b"\n")
        count += 1
    return digest.hexdigest(), count


def connect() -> FTP:
    raw = os.environ["FTP_SERVER"].strip()
    for prefix in ("ftp://", "ftps://"):
        if raw.lower().startswith(prefix):
            raw = raw[len(prefix) :]
    raw = raw.rstrip("/")
    port = 21
    if raw.count(":") == 1:
        host, port_text = raw.rsplit(":", 1)
        if port_text.isdigit():
            raw, port = host, int(port_text)
    ftp = FTP()
    ftp.connect(raw, port, timeout=60)
    ftp.login(os.environ["FTP_USERNAME"], os.environ["FTP_PASSWORD"])
    ftp.set_pasv(True)
    ftp.cwd(SERVER_DIR)
    return ftp


def retrieve(ftp: FTP, name: str) -> bytes | None:
    buffer = io.BytesIO()
    try:
        ftp.retrbinary(f"RETR {name}", buffer.write)
    except error_perm as exc:
        if str(exc).startswith("550"):
            return None
        raise
    return buffer.getvalue()


def write_outputs(upload: bool, baseline: bool) -> None:
    target = os.environ.get("GITHUB_OUTPUT")
    if not target:
        print(f"upload={str(upload).lower()}")
        print(f"baseline={str(baseline).lower()}")
        return
    with open(target, "a", encoding="utf-8") as handle:
        handle.write(f"upload={'true' if upload else 'false'}\n")
        handle.write(f"baseline={'true' if baseline else 'false'}\n")


def decide(root: Path) -> None:
    fingerprint, count = tree_hash(root)
    LOCAL_HASH.write_text(fingerprint + "\n", encoding="utf-8")
    print(f"Local node_modules fingerprint {fingerprint[:12]} ({count} files).")
    ftp = connect()
    try:
        remote = retrieve(ftp, HASH_NAME)
        if remote is not None and remote.decode().strip() == fingerprint:
            print("node_modules unchanged. This deploy will not upload that folder.")
            write_outputs(False, False)
            return
        if remote is None:
            state = retrieve(ftp, STATE_NAME)
            if state is not None and b"node_modules/" in state:
                print("node_modules are already on the server. Recording the fingerprint without uploading them again.")
                write_outputs(False, True)
                return
        print("node_modules changed or are missing. They will be uploaded.")
        write_outputs(True, False)
    finally:
        ftp.quit()


def record() -> None:
    payload = LOCAL_HASH.read_bytes()
    ftp = connect()
    try:
        ftp.storbinary(f"STOR {HASH_NAME}", io.BytesIO(payload))
    finally:
        ftp.quit()
    print("Recorded the published node_modules fingerprint.")


def self_test() -> None:
    import tempfile

    with tempfile.TemporaryDirectory() as folder:
        root = Path(folder)
        (root / "a.txt").write_text("one", encoding="utf-8")
        nested = root / "pkg"
        nested.mkdir()
        (nested / "b.txt").write_text("two", encoding="utf-8")
        first, first_count = tree_hash(root)
        second, second_count = tree_hash(root)
        assert first == second
        assert first_count == second_count == 2
        (nested / "b.txt").write_text("changed", encoding="utf-8")
        assert tree_hash(root)[0] != first
    print("node_modules sync self-test passed")


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "self-test":
        self_test()
    elif command == "decide":
        decide(Path(sys.argv[2]))
    elif command == "record":
        record()
    else:
        print("Usage: node-modules-sync.py decide <dir> | record | self-test", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
