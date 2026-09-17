#!/usr/bin/env bash
# Alcance de la auditoría: archivos cambiados desde la última auditoría registrada en docs/audits/.
set -u
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT" || exit 1

# Most recently written report (mtime), so several audits on the same date resolve correctly.
LAST="$(ls -1t docs/audits/*.md 2>/dev/null | grep -v _TEMPLATE | head -1)"
echo "## Última auditoría"
if [ -n "$LAST" ]; then echo "$LAST"; else echo "(ninguna)"; fi
echo

list_changed() { # dir
  if [ -n "$LAST" ]; then
    find "$1" -type f -newer "$LAST" \
      -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/storage/*' -not -path '*/.tmp/*' 2>/dev/null | sort
  else
    find "$1" -type f -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/storage/*' 2>/dev/null | sort
  fi
}

for section in "frontend/src" "frontend/public" "backend/src" "backend/config" "backend/lang" "backend/database/migrations" "backend/bin" "backend/tests" "docs" ".claude/skills"; do
  files="$(list_changed "$section")"
  count="$(printf '%s' "$files" | grep -c . || true)"
  echo "## $section ($count)"
  [ -n "$files" ] && printf '%s\n' "$files"
  echo
done

for f in _SITEMAP.md CHANGELOG.md CLAUDE.md README.md frontend/package.json frontend/vite.config.ts frontend/eslint.config.js frontend/index.html; do
  if [ -z "$LAST" ] || [ "$f" -nt "$LAST" ]; then echo "modificado: $f"; fi
done
echo

echo "## Endpoints declarados (routes.php modificados)"
for r in $(list_changed backend/src | grep 'routes.php$'); do
  echo "### $r"
  grep -nE '\$router->(get|post|patch|put|delete)\(' "$r" | sed -E "s/^\s*//"
done
echo

echo "## CHANGELOG (desde el inicio hasta la segunda versión publicada)"
awk '/^## \[/{n++} n>=1 && n<=2' CHANGELOG.md | head -80
