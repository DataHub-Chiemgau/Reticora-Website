#!/usr/bin/env bash
# Kürzt die Leitstand-Schriften (Achsen und Zeichenvorrat) und schreibt WOFF2 nach src/assets/fonts/.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=design/leitstand/fonts
OUT=src/assets/fonts
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
UNICODES='U+0020-007E,U+00A0-00FF,U+2013,U+2018-201A,U+201C-201E,U+2022,U+2026,U+20AC,U+2192'
mkdir -p "$OUT"

python3 -m fontTools.varLib.instancer "$SRC/archivo-latin-wdth-normal.woff2" wdth=100:112 wght=400:600 -o "$TMP/archivo.ttf"
python3 -m fontTools.varLib.instancer "$SRC/jetbrains-mono-latin-wght-normal.woff2" wght=400:500 -o "$TMP/mono.ttf"

python3 -m fontTools.subset "$TMP/archivo.ttf" --unicodes="$UNICODES" --flavor=woff2 \
  --layout-features='*' --no-hinting --output-file="$OUT/archivo-leitstand.woff2"
python3 -m fontTools.subset "$TMP/mono.ttf" --unicodes="$UNICODES" --flavor=woff2 \
  --layout-features='*' --no-hinting --output-file="$OUT/jetbrains-mono-leitstand.woff2"
ls -l "$OUT"
