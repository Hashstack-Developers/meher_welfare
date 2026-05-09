#!/usr/bin/env python3
"""
Rewrite css/style.css so Meher palette literals use var(--mwt-*).
Palette is read from scss/style.scss ($primary, $secondary, $tertiary, $quarternary).

Run after Sass:
  sass scss/style.scss css/style.css --no-source-map && python3 scripts/mwt-apply-css-vars.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCSS = ROOT / "scss" / "style.scss"
CSS = ROOT / "css" / "style.css"


def parse_sass_color(name: str, text: str) -> str | None:
    for line in text.splitlines():
        raw = line.split("//", 1)[0].strip()
        m = re.match(rf"^\${name}:\s*(.+);$", raw)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    return None


def expand_hex(h: str) -> str:
    h = h.lower().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return f"#{h}"


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = expand_hex(h)[1:]
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def main() -> int:
    if not SCSS.is_file() or not CSS.is_file():
        print("mwt-apply-css-vars: missing style.scss or style.css", file=sys.stderr)
        return 1

    scss = SCSS.read_text(encoding="utf-8")
    names = ("primary", "secondary", "tertiary", "quarternary")
    palette: list[tuple[str, str]] = []
    for n in names:
        v = parse_sass_color(n, scss)
        if not v or not v.startswith("#"):
            print(f"mwt-apply-css-vars: skip ${n} (not a hex colour: {v!r})", file=sys.stderr)
            continue
        palette.append((n, expand_hex(v)))

    if not palette:
        print("mwt-apply-css-vars: no palette hex found", file=sys.stderr)
        return 1

    css = CSS.read_text(encoding="utf-8")
    ph_hex: dict[str, str] = {}
    ph_rgb: dict[str, str] = {}

    for name, hex_norm in palette:
        var = f"--mwt-{name}"
        r, g, b = hex_rgb(hex_norm)
        ph_h = f"__MWT_HEX_{name.upper()}__"
        ph_r = f"__MWT_RGB_{name.upper()}__"

        css, n1 = re.subn(
            rf"(^\s*{re.escape(var)}:\s*){re.escape(hex_norm)}(\s*;\s*$)",
            rf"\1{ph_h}\2",
            css,
            flags=re.MULTILINE | re.IGNORECASE,
        )
        css, n2 = re.subn(
            rf"(^\s*{re.escape(var)}-rgb:\s*){r}\s*,\s*{g}\s*,\s*{b}(\s*;\s*$)",
            rf"\1{ph_r}\2",
            css,
            flags=re.MULTILINE,
        )
        if n1:
            ph_hex[name] = ph_h
        if n2:
            ph_rgb[name] = ph_r

    # Longer hex first so e.g. #a vs #abcdef does not collide (not an issue here).
    palette_sorted = sorted(palette, key=lambda x: len(x[1]), reverse=True)

    for name, hex_norm in palette_sorted:
        var_use = f"var(--mwt-{name})"
        css = re.sub(re.escape(hex_norm), var_use, css, flags=re.IGNORECASE)

        r, g, b = hex_rgb(hex_norm)
        var_rgb = f"--mwt-{name}-rgb"
        pat = rf"rgba\(\s*{r}\s*,\s*{g}\s*,\s*{b}\s*,"
        css = re.sub(pat, f"rgba(var({var_rgb}),", css)

    for name, hex_norm in palette:
        if name in ph_hex:
            css = css.replace(ph_hex[name], hex_norm)
        if name in ph_rgb:
            r, g, b = hex_rgb(hex_norm)
            css = css.replace(ph_rgb[name], f"{r}, {g}, {b}")

    CSS.write_text(css, encoding="utf-8")
    print("mwt-apply-css-vars: updated", CSS.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
