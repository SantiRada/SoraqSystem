#!/usr/bin/env bash
# Chequeos automáticos de la auditoría de Soraq. Salida: tabla Markdown (PASS / WARN / FAIL).
# Uso: bash .claude/skills/auditoria/scripts/automated-checks.sh
set -u
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SKILL="$ROOT/.claude/skills/auditoria"
PHP="${PHP_BIN:-/c/xampp/php/php.exe}"
MYSQL="${MYSQL_BIN:-/c/xampp/mysql/bin/mysql.exe}"
API="${API_URL:-http://localhost/SoraqSystem/backend/public}"
WEB="${WEB_URL:-http://localhost/SoraqSystem}"
LOG="$(mktemp -d)"
ROWS=()
FAILS=0; WARNS=0

row() { # id status name detail
  ROWS+=("| $1 | $2 | $3 | $4 |")
  [ "$2" = "FAIL" ] && FAILS=$((FAILS+1))
  [ "$2" = "WARN" ] && WARNS=$((WARNS+1))
  echo "[$2] $3" >&2
}
tail_of() { tail -n "${2:-3}" "$1" | tr '\n' ' ' | sed 's/|/\\|/g' | cut -c1-180; }

cd "$ROOT/frontend" || exit 1

# ── Frontend ────────────────────────────────────────────────────────────────
npm run -s typecheck >"$LOG/tsc" 2>&1 && row A1 PASS "TypeScript (strict)" "" || row A1 FAIL "TypeScript (strict)" "$(tail_of "$LOG/tsc" 5)"
npx eslint . >"$LOG/lint" 2>&1 && row A2 PASS "ESLint (jsx-a11y strict, fronteras, XSS)" "" || row A2 FAIL "ESLint" "$(tail_of "$LOG/lint" 5)"
npx vite build >"$LOG/build" 2>&1 && row A3 PASS "Build de producción" "$(grep -E 'built in' "$LOG/build" | tr -d '\033' | sed 's/\[[0-9;]*m//g')" || row A3 FAIL "Build de producción" "$(tail_of "$LOG/build" 5)"
maps="$(find dist -name '*.map' 2>/dev/null | wc -l)"
[ "$maps" -eq 0 ] && row A4 PASS "Sin source maps en dist" "" || row A4 FAIL "Source maps en dist" "$maps archivos"
npm audit --omit=dev --audit-level=high >"$LOG/audit" 2>&1 && row A5 PASS "npm audit (high/critical)" "$(tail_of "$LOG/audit" 1)" || row A5 FAIL "npm audit (high/critical)" "$(tail_of "$LOG/audit" 3)"

cd "$ROOT" || exit 1

# ── Backend ─────────────────────────────────────────────────────────────────
phpErr="$(find backend -name '*.php' -not -path '*/storage/*' -exec "$PHP" -l {} \; 2>&1 | grep -v 'No syntax errors')"
[ -z "$phpErr" ] && row B1 PASS "Sintaxis PHP" "" || row B1 FAIL "Sintaxis PHP" "$(echo "$phpErr" | head -3 | tr '\n' ' ')"
pending="$("$PHP" backend/bin/migrate.php --status 2>&1 | grep -c pending)"
[ "$pending" -eq 0 ] && row B2 PASS "Migraciones aplicadas (local)" "" || row B2 WARN "Migraciones pendientes (local)" "$pending"
health="$(curl -s -o /dev/null -w '%{http_code}' "$API/health")"
if [ "$health" = "200" ]; then
  row B3 PASS "API responde /health" ""
  bash backend/tests/smoke/api-smoke.sh --reset-rate-limits >"$LOG/smoke" 2>&1
  summary="$(grep -E '^Passed' "$LOG/smoke")"
  if grep -q 'Failed: 0' "$LOG/smoke"; then row B4 PASS "Smoke test API + control de acceso" "$summary"; else row B4 FAIL "Smoke test API" "$summary · $(grep FAIL "$LOG/smoke" | head -3 | tr '\n' ' ')"; fi
  leftovers="$("$MYSQL" -uroot soraq_local -N -e "SELECT COUNT(*) FROM users WHERE email LIKE 'smoke-%@example.com'" 2>/dev/null)"
  [ "${leftovers:-0}" = "0" ] && row B5 PASS "Smoke test limpia sus usuarios" "" || row B5 WARN "Usuarios de smoke test restantes" "$leftovers"
  # Exposición HTTP de archivos internos (XAMPP local)
  exposed=""
  for p in backend/.env backend/config/database.php backend/src/Core/Services.php backend/storage/logs/ backend/storage/sessions/ backend/bin/migrate.php backend/lang/es/errors.php backend/database/migrations/ backend/public/.htaccess docs/ .claude/ _SITEMAP.md; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$WEB/$p")"
    [ "$code" = "200" ] && exposed="$exposed $p"
  done
  [ -z "$exposed" ] && row B6 PASS "Archivos internos no accesibles por HTTP" "" || row B6 FAIL "Archivos internos expuestos" "$exposed"
  headers="$(curl -s -D - -o /dev/null "$API/health")"
  missing=""
  for h in "X-Content-Type-Options" "X-Frame-Options" "Content-Security-Policy" "Cache-Control: no-store" "Referrer-Policy"; do
    echo "$headers" | grep -qi "$h" || missing="$missing $h"
  done
  echo "$headers" | grep -qi "X-Powered-By" && missing="$missing (X-Powered-By presente)"
  [ -z "$missing" ] && row B7 PASS "Headers de seguridad del API" "" || row B7 FAIL "Headers de seguridad del API" "$missing"
  errBody="$(curl -s "$API/projects")"
  echo "$errBody" | grep -qiE 'sqlstate|exception|stack|\.php|trace' && row B8 FAIL "Errores del API filtran internos" "$errBody" || row B8 PASS "Errores del API sin detalles internos" ""
else
  row B3 FAIL "API no responde" "HTTP $health — iniciar Apache/MySQL (Paso 0)"
fi
debugCount="$("$MYSQL" -uroot soraq_local -N -e "SELECT COUNT(*) FROM users WHERE email='debug@debug.com'" 2>/dev/null)"
row B9 WARN "Cuenta debug (debug@debug.com)" "presente en local: ${debugCount:-?}. Debe NO existir en staging/producción (SECURITY_AUDIT §4.2b)"

# ── Heurísticas de código ──────────────────────────────────────────────────
sqlConcat="$(grep -rnE "(fetchOne|fetchAll|execute|insert)\([^)]*['\"][^'\"]*['\"] *\. *\\\$" backend/src --include='*.php' | grep -vE "self::|LIMIT ' \. self::" )"
sqlConcat2="$(grep -rnE "(SELECT|INSERT|UPDATE|DELETE)[^;]*' *\. *\\\$[a-z]" backend/src --include='*.php' | grep -v "self::")"
[ -z "$sqlConcat$sqlConcat2" ] && row C1 PASS "Sin variables concatenadas en SQL" "" || row C1 FAIL "Posible SQL concatenado" "$(echo "$sqlConcat$sqlConcat2" | head -3 | tr '\n' ' ')"
danger="$(grep -rn "dangerouslySetInnerHTML\|innerHTML *=" frontend/src)"
[ -z "$danger" ] && row C2 PASS "Sin HTML crudo (XSS)" "" || row C2 FAIL "HTML crudo en frontend" "$(echo "$danger" | head -3 | tr '\n' ' ')"
secrets="$(grep -rnE "VITE_[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD|PRIVATE)" frontend/src frontend/.env* 2>/dev/null)"
[ -z "$secrets" ] && row C3 PASS "Sin secretos en variables VITE_*" "" || row C3 FAIL "Posibles secretos en VITE_*" "$(echo "$secrets" | head -3 | tr '\n' ' ')"
envTracked="$(grep -E '^\.env$' .gitignore)"
[ -n "$envTracked" ] && row C4 PASS ".env ignorado por git" "" || row C4 FAIL ".env no está en .gitignore" ""
storage="$(grep -rnE "localStorage\.(setItem|getItem)\(" frontend/src | grep -vE "soraq-theme|shared/theme/ThemeProvider.tsx|workspace/hooks/useSidebarCollapsed.ts")"
[ -z "$storage" ] && row C5 PASS "localStorage solo para preferencias no sensibles" "" || row C5 WARN "Uso de localStorage a revisar" "$(echo "$storage" | head -3 | tr '\n' ' ')"
hex="$(grep -rnE "#[0-9a-fA-F]{6}\b" frontend/src --include='*.tsx' | grep -vE "Logo.tsx|data/tools.ts|shared/theme/ThemeProvider.tsx")"  # allowlist: brand SVG, tool monograms, <meta theme-color>
[ -z "$hex" ] && row C6 PASS "Sin colores hex en componentes (solo tokens)" "" || row C6 WARN "Colores hex hardcodeados" "$(echo "$hex" | head -3 | tr '\n' ' ')"
heroui="$(grep -rn "from '@heroui\|from 'react-aria-components'" frontend/src --include='*.ts*' | grep -vE "src/design-system/|shared/lib/cn.ts|app/layouts/RootLayout.tsx|src/i18n/")"
[ -z "$heroui" ] && row C7 PASS "HeroUI solo vía @/design-system" "" || row C7 FAIL "Imports directos de HeroUI" "$(echo "$heroui" | head -3 | tr '\n' ' ')"
moj="$(grep -rlE "Ã[¡-ÿ]|â€" frontend/src backend/src backend/lang docs CHANGELOG.md CLAUDE.md _SITEMAP.md 2>/dev/null)"
[ -z "$moj" ] && row C8 PASS "Sin mojibake (UTF-8 correcto)" "" || row C8 FAIL "Texto con codificación rota" "$(echo "$moj" | tr '\n' ' ')"
logs="$(grep -rnE "console\.(log|debug)\(" frontend/src)"
[ -z "$logs" ] && row C9 PASS "Sin console.log olvidados" "" || row C9 WARN "console.log en código" "$(echo "$logs" | head -3 | tr '\n' ' ')"
debugPhp="$(grep -rnE "\b(var_dump|print_r|dd)\(|error_reporting\(E_ALL\)" backend/src)"
[ -z "$debugPhp" ] && row C10 PASS "Sin volcados de depuración PHP" "" || row C10 FAIL "Depuración PHP en código" "$(echo "$debugPhp" | head -3 | tr '\n' ' ')"
todos="$(grep -rnE "TODO|FIXME|HACK" frontend/src backend/src | wc -l)"
[ "$todos" -eq 0 ] && row C11 PASS "Sin TODO/FIXME" "" || row C11 WARN "TODO/FIXME pendientes" "$todos"
big="$(find frontend/src backend/src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.php' \) -not -path '*/i18n/locales/*' -exec wc -l {} + | awk '$1>350 && $2!="total"{print $2" ("$1")"}')"
[ -z "$big" ] && row C12 PASS "Sin archivos > 350 líneas (fuera de catálogos)" "" || row C12 WARN "Archivos grandes (evaluar división)" "$(echo "$big" | tr '\n' ' ')"
inlineStyle="$(grep -rn "style={{" frontend/src --include='*.tsx' | grep -vE "RailLink.tsx|card-sorting/participant/ParticipantPage.tsx|card-sorting/components/settings/SettingsTab.tsx|card-sorting/components/report/QuestionsReport.tsx|card-sorting/components/report/ChartTooltip.tsx")"  # allowlist: fixed-position labels, validated accent CSS variables, data-driven bar widths
[ -z "$inlineStyle" ] && row C13 PASS "Sin estilos inline (CSP / tokens)" "" || row C13 WARN "Estilos inline" "$(echo "$inlineStyle" | head -3 | tr '\n' ' ')"
routesNoAuth="$(for f in backend/src/Modules/*/routes.php; do m="$(basename "$(dirname "$f")")"; case "$m" in Health|Auth) continue;; esac; grep -q "requireAuth" "$f" || echo "$m"; done)"
[ -z "$routesNoAuth" ] && row C14 PASS "Módulos con endpoints bajo RequireAuth" "" || row C14 WARN "Módulos sin RequireAuth (verificar que sean públicos a propósito)" "$routesNoAuth"
[ -f frontend/public/robots.txt ] && [ -f frontend/public/sitemap.xml ] && row C15 PASS "robots.txt y sitemap.xml presentes" "" || row C15 FAIL "Falta robots.txt o sitemap.xml" ""

# ── i18n y contraste ────────────────────────────────────────────────────────
node "$SKILL/scripts/i18n-audit.mjs" >"$LOG/i18n" 2>&1
case $? in
  0) row D1 PASS "i18n: claves y textos" "$(grep '^Resumen' "$LOG/i18n")";;
  2) row D1 WARN "i18n: revisar" "$(grep '^Resumen' "$LOG/i18n") (ver i18n-audit.mjs)";;
  *) row D1 FAIL "i18n" "$(tail_of "$LOG/i18n" 3)";;
esac
node "$SKILL/scripts/contrast.mjs" >"$LOG/contrast" 2>&1
case $? in
  0) row D2 PASS "Contraste WCAG de tokens (oscuro y claro)" "$(grep '^Resumen' "$LOG/contrast")";;
  *) row D2 FAIL "Contraste WCAG de tokens" "$(grep -E 'FAIL|Resumen' "$LOG/contrast" | head -4 | tr '\n' ' ')";;
esac

# ── Salida ──────────────────────────────────────────────────────────────────
echo
echo "## Chequeos automáticos — $(date '+%Y-%m-%d %H:%M')"
echo
echo "| # | Resultado | Chequeo | Detalle |"
echo "|---|---|---|---|"
printf '%s\n' "${ROWS[@]}"
echo
echo "Resumen: ${#ROWS[@]} chequeos · FAIL: $FAILS · WARN: $WARNS"
echo "Logs completos: $LOG"
[ "$FAILS" -eq 0 ]
