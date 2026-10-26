#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Pandoc ist nicht installiert." >&2
  exit 1
fi

mapfile -t files < edition/lesereihenfolge.txt
for file in "${files[@]}"; do
  [[ -s "$file" ]] || { echo "Fehlende oder leere Manuskriptdatei: $file" >&2; exit 1; }
done

mkdir -p dist
pandoc "${files[@]}" \
  --from markdown+smart \
  --metadata-file edition/metadata.yaml \
  --standalone --to epub3 \
  -o dist/zuletzt-online.epub
echo "EPUB: dist/zuletzt-online.epub"

# Satzprobe, noch nicht die endgültige Druckausgabe:
if command -v xelatex >/dev/null 2>&1; then
  pandoc "${files[@]}" \
    --from markdown+smart \
    --metadata-file edition/metadata.yaml \
    --pdf-engine=xelatex \
    -V documentclass=book \
    -V papersize=a5 \
    -V geometry:margin=19mm \
    -o dist/zuletzt-online-satzprobe.pdf
  echo "PDF-Satzprobe: dist/zuletzt-online-satzprobe.pdf"
else
  echo "XeLaTeX nicht gefunden; PDF-Satzprobe übersprungen."
fi
