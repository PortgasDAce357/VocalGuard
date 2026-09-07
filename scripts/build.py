#!/usr/bin/env python3
"""VocalGuard build script.

Stamps the SHA-256 integrity hash into index.html so the tamper check works.

Usage:
    python3 scripts/build.py            # build in place (index.html)
    python3 scripts/build.py -o dist/   # write built file to another dir
"""
import argparse
import hashlib
import os
import re
import sys

PLACEHOLDER = "__VOCALGUARD_HASH__"
MARKER = re.compile(r'vocalguard-hash" content="[0-9a-f]{0,64}"')


def build(src: str) -> tuple[str, str]:
    """Return (final_html, embedded_hash)."""
    if PLACEHOLDER not in src:
        # Restore the placeholder from any previously-embedded hash.
        src = MARKER.sub(
            f'vocalguard-hash" content="{PLACEHOLDER}"', src, count=1
        )
    assert PLACEHOLDER in src, "integrity placeholder missing in index.html"

    # The hash is computed over the file with the 64-char slot blanked out,
    # so verify and build sides are always in agreement.
    blanked = src.replace(PLACEHOLDER, "0" * 64)
    digest = hashlib.sha256(blanked.encode("utf-8")).hexdigest()
    final = src.replace(PLACEHOLDER, digest)

    # Round-trip check
    rebuilt_blanked = final.replace(
        f'vocalguard-hash" content="{digest}"',
        f'vocalguard-hash" content="{"0" * 64}"',
    )
    if hashlib.sha256(rebuilt_blanked.encode("utf-8")).hexdigest() != digest:
        sys.exit("ERROR: hash round-trip failed; something is broken.")
    return final, digest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", default=None, help="output directory")
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root, "index.html")
    with open(src_path, encoding="utf-8") as fh:
        src = fh.read()

    final, digest = build(src)

    if args.out:
        os.makedirs(args.out, exist_ok=True)
        out_path = os.path.join(args.out, "index.html")
    else:
        out_path = src_path

    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(final)
    print(f"built {out_path}  ({digest[:12]}…)")
    return 0


if __name__ == "__main__":
    sys.exit(main())