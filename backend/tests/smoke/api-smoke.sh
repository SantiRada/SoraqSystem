#!/usr/bin/env bash
# API smoke + access-control test. Creates throwaway users; run ONLY against local/staging.
#
#   bash backend/tests/smoke/api-smoke.sh [--reset-rate-limits] [API_BASE_URL] [ALLOWED_ORIGIN]
#
# Registration is limited to 5/hour per IP, so repeated runs hit 429 by design.
# --reset-rate-limits empties the LOCAL `rate_limits` table first (XAMPP root, soraq_local).
set -u
if [ "${1:-}" = "--reset-rate-limits" ]; then
  shift
  "${MYSQL_BIN:-/c/xampp/mysql/bin/mysql.exe}" -uroot soraq_local -e 'DELETE FROM rate_limits' && echo "Local rate limits cleared."
fi
API="${1:-http://localhost/SoraqSystem/backend/public}"
ORIGIN="${2:-http://localhost:5173}"
TMP="$(mktemp -d)"
PASS=0; FAIL=0
RUN_ID="$(date +%s)$RANDOM"

check() { # name expected actual
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ok   $1"; else FAIL=$((FAIL+1)); echo "  FAIL $1 (expected $2, got $3)"; fi
}
# req <jar> <method> <path> [json] [csrf] → prints status, body in $TMP/body
req() {
  local args=(-s -o "$TMP/body" -w '%{http_code}' -X "$2" -b "$TMP/$1" -c "$TMP/$1" -H "Origin: $ORIGIN")
  [ -n "${4:-}" ] && args+=(-H 'Content-Type: application/json' --data "$4")
  [ -n "${5:-}" ] && args+=(-H "X-CSRF-Token: $5")
  curl "${args[@]}" "$API$3"
}
csrf_of() { grep -o '"csrfToken":"[a-f0-9]*"' "$TMP/body" | cut -d'"' -f4; }
field() { grep -o "\"$1\":\"[^\"]*\"" "$TMP/body" | head -1 | cut -d'"' -f4; }

echo "Soraq API smoke test → $API"

check "health"                      200 "$(req a GET /health)"
check "unknown endpoint is 404"     404 "$(req a GET /does-not-exist)"
check "wrong method is 405"         405 "$(req a DELETE /health)"

req a GET /auth/session >/dev/null; CSRF_A="$(csrf_of)"
check "session issues csrf token"   64 "${#CSRF_A}"

check "POST without CSRF is 403"    403 "$(req a POST /auth/login '{"email":"x@y.z","password":"x"}')"
check "foreign Origin is 403"       403 "$(curl -s -o /dev/null -w '%{http_code}' -X POST -b "$TMP/a" -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF_A" --data '{}' "$API/auth/login")"
check "non-JSON body is 415"        415 "$(curl -s -o /dev/null -w '%{http_code}' -X POST -b "$TMP/a" -H "Origin: $ORIGIN" -H "X-CSRF-Token: $CSRF_A" --data 'email=a' "$API/auth/login")"
check "validation errors are 422"   422 "$(req a POST /auth/login '{"email":"","password":""}' "$CSRF_A")"
check "anonymous projects is 401"   401 "$(req a GET /projects)"

EMAIL_A="smoke-a-$RUN_ID@example.com"
STATUS="$(req a POST /auth/register "{\"email\":\"$EMAIL_A\",\"password\":\"correct-horse-battery\",\"displayName\":\"Smoke A\"}" "$CSRF_A")"
if [ "$STATUS" = "429" ]; then
  echo "  Registration rate limit reached (expected behaviour). Re-run locally with --reset-rate-limits."
  rm -rf "$TMP"; exit 2
fi
check "register user A"             201 "$STATUS"
NEW_CSRF_A="$(csrf_of)"
if [ "$NEW_CSRF_A" != "$CSRF_A" ]; then check "csrf rotated on register" 1 1; else check "csrf rotated on register" rotated same; fi
CSRF_A="$NEW_CSRF_A"
grep -q password "$TMP/body" && check "no password data in response" absent present || check "no password data in response" 1 1
check "duplicate email is 422"      422 "$(req a POST /auth/register "{\"email\":\"$EMAIL_A\",\"password\":\"correct-horse-battery\",\"displayName\":\"Dup\"}" "$CSRF_A")"

check "create project"              201 "$(req a POST /projects '{"name":"Smoke project","description":"<script>alert(1)</script>"}' "$CSRF_A")"
PROJECT_ID="$(field id)"
check "project id is a ULID"        26 "${#PROJECT_ID}"
check "owner can read project"      200 "$(req a GET "/projects/$PROJECT_ID")"
grep -Eq 'owner_user_id|ownerUserId|"id":[0-9]' "$TMP/body" && check "no internal ids in response" absent present || check "no internal ids in response" 1 1
check "list projects"               200 "$(req a GET /projects)"

req b GET /auth/session >/dev/null; CSRF_B="$(csrf_of)"
EMAIL_B="smoke-b-$RUN_ID@example.com"
check "register user B"             201 "$(req b POST /auth/register "{\"email\":\"$EMAIL_B\",\"password\":\"correct-horse-battery\",\"displayName\":\"Smoke B\"}" "$CSRF_B")"
USER_B_ID="$(field id)"; CSRF_B="$(csrf_of)"
check "IDOR: B cannot read A's project (404)" 404 "$(req b GET "/projects/$PROJECT_ID")"
req b GET /projects >/dev/null
grep -q "$PROJECT_ID" "$TMP/body" && check "IDOR: A's project not in B's list" absent present || check "IDOR: A's project not in B's list" 1 1
check "malformed id is 404"         404 "$(req b GET "/projects/1%20OR%201=1")"

check "logout"                      200 "$(req a POST /auth/logout '{}' "$CSRF_A")"
CSRF_A="$(csrf_of)"
check "after logout projects is 401" 401 "$(req a GET /projects)"
check "wrong password is 401"       401 "$(req a POST /auth/login "{\"email\":\"$EMAIL_A\",\"password\":\"wrong-password-123\"}" "$CSRF_A")"
check "unknown email is 401 (same)" 401 "$(req a POST /auth/login '{"email":"nobody@example.com","password":"wrong-password-123"}' "$CSRF_A")"
check "login"                       200 "$(req a POST /auth/login "{\"email\":\"$EMAIL_A\",\"password\":\"correct-horse-battery\"}" "$CSRF_A")"

CSRF_A="$(csrf_of)"

# ── Project settings & sharing (owner / editor / viewer / outsider) ─────────
check "billing overview (new user)"          200 "$(req a GET /billing/overview)"
check "IDOR: B cannot rename A's project"    404 "$(req b PATCH "/projects/$PROJECT_ID" '{"name":"Hacked"}' "$CSRF_B")"
check "IDOR: B cannot delete A's project"    404 "$(req b DELETE "/projects/$PROJECT_ID" '{"confirmName":"Smoke project"}' "$CSRF_B")"
check "IDOR: B cannot list A's members"      404 "$(req b GET "/projects/$PROJECT_ID/members")"
check "owner renames project"                200 "$(req a PATCH "/projects/$PROJECT_ID" '{"name":"Smoke renamed","description":null}' "$CSRF_A")"
check "add unknown email is 422"             422 "$(req a POST "/projects/$PROJECT_ID/members" '{"email":"nobody-'"$RUN_ID"'@example.com","role":"viewer"}' "$CSRF_A")"
check "invalid role is 422"                  422 "$(req a POST "/projects/$PROJECT_ID/members" "{\"email\":\"$EMAIL_B\",\"role\":\"owner\"}" "$CSRF_A")"
check "owner adds B as viewer"               201 "$(req a POST "/projects/$PROJECT_ID/members" "{\"email\":\"$EMAIL_B\",\"role\":\"viewer\"}" "$CSRF_A")"
check "adding B twice is 422"                422 "$(req a POST "/projects/$PROJECT_ID/members" "{\"email\":\"$EMAIL_B\",\"role\":\"viewer\"}" "$CSRF_A")"
check "viewer B can read project"            200 "$(req b GET "/projects/$PROJECT_ID")"
grep -q '"accessRole":"viewer"' "$TMP/body" && check "B sees role viewer" 1 1 || check "B sees role viewer" viewer other
check "viewer B can list members"            200 "$(req b GET "/projects/$PROJECT_ID/members")"
check "viewer B cannot rename (403)"         403 "$(req b PATCH "/projects/$PROJECT_ID" '{"name":"Viewer edit"}' "$CSRF_B")"
check "viewer B cannot add members (403)"    403 "$(req b POST "/projects/$PROJECT_ID/members" "{\"email\":\"$EMAIL_A\",\"role\":\"viewer\"}" "$CSRF_B")"

# ── Product notes & context prompt (ProductContext module) ──────────────────
check "owner creates note"                   201 "$(req a POST "/projects/$PROJECT_ID/notes" '{"title":"Problem","body":"Designers lose context between tools."}' "$CSRF_A")"
NOTE_ID="$(field id)"
check "note id is a ULID"                    26 "${#NOTE_ID}"
check "note without title is 422"            422 "$(req a POST "/projects/$PROJECT_ID/notes" '{"title":"","body":"x"}' "$CSRF_A")"
check "owner updates note"                   200 "$(req a PATCH "/projects/$PROJECT_ID/notes/$NOTE_ID" '{"title":"Problem","body":"Edited"}' "$CSRF_A")"
check "malformed note id is 404"             404 "$(req a PATCH "/projects/$PROJECT_ID/notes/1%20OR%201" '{"title":"x","body":"x"}' "$CSRF_A")"
check "viewer B can list notes"              200 "$(req b GET "/projects/$PROJECT_ID/notes")"
check "viewer B cannot create note (403)"    403 "$(req b POST "/projects/$PROJECT_ID/notes" '{"title":"x","body":"x"}' "$CSRF_B")"
check "viewer B cannot delete note (403)"    403 "$(req b DELETE "/projects/$PROJECT_ID/notes/$NOTE_ID" '{}' "$CSRF_B")"
check "viewer B can read context prompt"     200 "$(req b GET "/projects/$PROJECT_ID/context-prompt")"
grep -q '"isStale":true' "$TMP/body" && check "context prompt is stale" 1 1 || check "context prompt is stale" stale fresh
check "viewer B cannot generate (403)"       403 "$(req b POST "/projects/$PROJECT_ID/context-prompt" '{}' "$CSRF_B")"
GEN="$(req a POST "/projects/$PROJECT_ID/context-prompt" '{}' "$CSRF_A")"
case "$GEN" in 200|503) check "owner generate is 200 (AI) or 503 (no key)" 1 1 ;; *) check "owner generate is 200 (AI) or 503 (no key)" "200|503" "$GEN" ;; esac
grep -Eq 'gsk_|api.groq|Authorization' "$TMP/body" && check "no AI secrets in response" absent present || check "no AI secrets in response" 1 1
check "owner promotes B to editor"           200 "$(req a PATCH "/projects/$PROJECT_ID/members/$USER_B_ID" '{"role":"editor"}' "$CSRF_A")"
check "editor B can rename"                  200 "$(req b PATCH "/projects/$PROJECT_ID" '{"name":"Editor edit"}' "$CSRF_B")"
check "editor B cannot delete (403)"         403 "$(req b DELETE "/projects/$PROJECT_ID" '{"confirmName":"Editor edit"}' "$CSRF_B")"
check "B leaves the project"                 204 "$(req b DELETE "/projects/$PROJECT_ID/members/$USER_B_ID" '{}' "$CSRF_B")"
check "after leaving B gets 404"             404 "$(req b GET "/projects/$PROJECT_ID")"
check "IDOR: outsider B notes is 404"        404 "$(req b GET "/projects/$PROJECT_ID/notes")"
check "IDOR: outsider B edit note is 404"    404 "$(req b PATCH "/projects/$PROJECT_ID/notes/$NOTE_ID" '{"title":"x","body":"x"}' "$CSRF_B")"
check "IDOR: outsider B prompt is 404"       404 "$(req b GET "/projects/$PROJECT_ID/context-prompt")"
check "owner deletes note"                   204 "$(req a DELETE "/projects/$PROJECT_ID/notes/$NOTE_ID" '{}' "$CSRF_A")"
check "deleted note is 404"                  404 "$(req a DELETE "/projects/$PROJECT_ID/notes/$NOTE_ID" '{}' "$CSRF_A")"

# ── Card Sorting (designer + participant) ───────────────────────────────────
check "create card sort"                     201 "$(req a POST "/projects/$PROJECT_ID/card-sorts" '{"name":"Smoke sort"}' "$CSRF_A")"
CS_ID="$(field id)"; cp "$TMP/body" "$TMP/cs.json"
check "card sort id is a ULID"               26 "${#CS_ID}"
check "IDOR: outsider B card sort is 404"    404 "$(req b GET "/card-sorts/$CS_ID")"
check "IDOR: outsider B list is 404"         404 "$(req b GET "/projects/$PROJECT_ID/card-sorts")"
check "IDOR: outsider B patch is 404"        404 "$(req b PATCH "/card-sorts/$CS_ID" '{"name":"x"}' "$CSRF_B")"
check "publish without cards is 422"         422 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"publish"}' "$CSRF_A")"
node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).data;
d.sortType = "hybrid";
d.cards = [{ id: "c1", label: "Home" }, { id: "c2", label: "Pricing" }, { id: "c3", label: "Blog" }];
d.categories = [{ id: "k1", label: "Company" }];
d.flow.screening.enabled = true;
d.flow.screening.questions = [{ id: "q1", prompt: "Designer?", options: [{ id: "o1", label: "Yes", qualifies: true }, { id: "o2", label: "No", qualifies: false }] }];
d.flow.postStudy.enabled = true;
d.flow.postStudy.questions = [{ id: "p1", type: "stars", prompt: "Rate", required: true, scaleMax: 5 }, { id: "p2", type: "text", prompt: "Why", required: false }];
d.settings.accentColor = "#FF5500";
d.settings.socialLinks = { github: "https://github.com/soraq" };
fs.writeFileSync(process.argv[2], JSON.stringify(d));
const bad = JSON.parse(JSON.stringify(d)); bad.purpose = { type: "doc", content: [{ type: "script", text: "x" }] };
fs.writeFileSync(process.argv[3], JSON.stringify(bad));
' "$(cygpath -w "$TMP/cs.json")" "$(cygpath -w "$TMP/cs-doc.json")" "$(cygpath -w "$TMP/cs-bad.json")"
check "owner saves card sort document"       200 "$(req a PATCH "/card-sorts/$CS_ID" "@$TMP/cs-doc.json" "$CSRF_A")"
grep -q '"accentColor":"#ff5500"' "$TMP/body" && check "accent color normalised" 1 1 || check "accent color normalised" "#ff5500" other
check "unknown rich text node is 422"        422 "$(req a PATCH "/card-sorts/$CS_ID" "@$TMP/cs-bad.json" "$CSRF_A")"
check "draft link is 404"                    404 "$(req c GET "/public/card-sorts/abcdefgh")"
check "publish"                              200 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"publish"}' "$CSRF_A")"
CS_CODE="$(field publicPath | awk -F/ '{print $NF}')"
check "share code generated"                 8 "${#CS_CODE}"
req c GET /auth/session >/dev/null; CSRF_C="$(csrf_of)"
check "public landing"                       200 "$(req c GET "/public/card-sorts/$CS_CODE")"
check "participant start"                    201 "$(req c POST "/public/card-sorts/$CS_CODE/responses" '{}' "$CSRF_C")"
grep -q qualifies "$TMP/body" && check "screening rules not exposed" absent present || check "screening rules not exposed" 1 1
TOKEN1="$(field token)"
check "screened out participant"             200 "$(req c POST "/public/card-sorts/$CS_CODE/screening" "{\"token\":\"$TOKEN1\",\"answers\":{\"q1\":\"o2\"}}" "$CSRF_C")"
grep -q '"result":"screened_out"' "$TMP/body" && check "screening rejects" 1 1 || check "screening rejects" screened_out other
check "participant 2 start"                  201 "$(req c POST "/public/card-sorts/$CS_CODE/responses" '{}' "$CSRF_C")"
TOKEN2="$(field token)"
check "complete before screening is 409"     409 "$(req c POST "/public/card-sorts/$CS_CODE/complete" "{\"token\":\"$TOKEN2\",\"categories\":[]}" "$CSRF_C")"
check "screening passes"                     200 "$(req c POST "/public/card-sorts/$CS_CODE/screening" "{\"token\":\"$TOKEN2\",\"answers\":{\"q1\":\"o1\"}}" "$CSRF_C")"
check "unsorted cards are 422"               422 "$(req c POST "/public/card-sorts/$CS_CODE/complete" "{\"token\":\"$TOKEN2\",\"categories\":[{\"label\":\"Main\",\"cardIds\":[\"c1\"]}],\"postAnswers\":{\"p1\":4}}" "$CSRF_C")"
check "missing required answer is 422"       422 "$(req c POST "/public/card-sorts/$CS_CODE/complete" "{\"token\":\"$TOKEN2\",\"categories\":[{\"label\":\"Main\",\"cardIds\":[\"c1\",\"c2\",\"c3\"]}],\"postAnswers\":{}}" "$CSRF_C")"
check "participant completes"                200 "$(req c POST "/public/card-sorts/$CS_CODE/complete" "{\"token\":\"$TOKEN2\",\"categories\":[{\"label\":\"Main\",\"cardIds\":[\"c1\",\"c2\"]},{\"predefinedId\":\"k1\",\"cardIds\":[\"c3\"]}],\"postAnswers\":{\"p1\":4,\"p2\":\"ok\"}}" "$CSRF_C")"
check "completing twice is 409"              409 "$(req c POST "/public/card-sorts/$CS_CODE/complete" "{\"token\":\"$TOKEN2\",\"categories\":[]}" "$CSRF_C")"
check "report"                               200 "$(req a GET "/card-sorts/$CS_ID/report")"
grep -q '"number":2' "$TMP/body" && check "report numbers participants" 1 1 || check "report numbers participants" 2 other
check "owner shares study with B (view)"     201 "$(req a POST "/card-sorts/$CS_ID/viewers" "{\"email\":\"$EMAIL_B\"}" "$CSRF_A")"
check "shared viewer B reads study"          200 "$(req b GET "/card-sorts/$CS_ID")"
check "shared viewer B reads report"         200 "$(req b GET "/card-sorts/$CS_ID/report")"
check "shared viewer B cannot edit (403)"    403 "$(req b PATCH "/card-sorts/$CS_ID" '{"name":"x"}' "$CSRF_B")"
check "shared viewer B cannot delete (403)"  403 "$(req b DELETE "/card-sorts/$CS_ID/responses" '{"confirmName":"Smoke sort"}' "$CSRF_B")"
check "shared viewer B no project access"    404 "$(req b GET "/projects/$PROJECT_ID")"
check "shared list for B"                    200 "$(req b GET /card-sorts/shared)"
grep -q "$CS_ID" "$TMP/body" && check "study in B shared list" 1 1 || check "study in B shared list" present absent
check "pause"                                200 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"pause"}' "$CSRF_A")"
check "paused study cannot start (409)"      409 "$(req c POST "/public/card-sorts/$CS_CODE/responses" '{}' "$CSRF_C")"
check "resume"                               200 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"resume"}' "$CSRF_A")"
check "close"                                200 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"close"}' "$CSRF_A")"
check "closed landing"                       200 "$(req c GET "/public/card-sorts/$CS_CODE")"
grep -q '"status":"closed"' "$TMP/body" && check "landing shows closed" 1 1 || check "landing shows closed" closed other
check "closed cannot resume (409)"           409 "$(req a POST "/card-sorts/$CS_ID/status" '{"action":"resume"}' "$CSRF_A")"
check "delete results wrong name is 422"     422 "$(req a DELETE "/card-sorts/$CS_ID/responses" '{"confirmName":"nope"}' "$CSRF_A")"
check "delete results"                       204 "$(req a DELETE "/card-sorts/$CS_ID/responses" '{"confirmName":"Smoke sort"}' "$CSRF_A")"
check "delete card sort"                     204 "$(req a DELETE "/card-sorts/$CS_ID" '{"confirmName":"Smoke sort"}' "$CSRF_A")"
check "deleted card sort is 404"             404 "$(req a GET "/card-sorts/$CS_ID")"

# ── Tree Testing (designer + participant) ───────────────────────────────────
check "create tree test"                     201 "$(req a POST "/projects/$PROJECT_ID/tree-tests" '{"name":"Smoke tree"}' "$CSRF_A")"
TT_ID="$(field id)"; cp "$TMP/body" "$TMP/tt.json"
check "tree test id is a ULID"               26 "${#TT_ID}"
check "IDOR: outsider B tree test is 404"    404 "$(req b GET "/tree-tests/$TT_ID")"
check "publish empty tree is 422"            422 "$(req a POST "/tree-tests/$TT_ID/status" '{"action":"publish"}' "$CSRF_A")"
node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).data;
d.tree = [
  { id: "n1", label: "Productos", children: [{ id: "n11", label: "Zapatos", children: [] }, { id: "n12", label: "Camisas", children: [] }] },
  { id: "n2", label: "Ayuda", children: [{ id: "n21", label: "Envios", children: [] }] },
];
d.tasks = [
  { id: "t1", prompt: "Donde comprarias zapatos?", paths: [{ id: "p1", nodeIds: ["n1", "n11"], isPrimary: true }, { id: "p2", nodeIds: ["n2", "n21"], isPrimary: false }] },
  { id: "t2", prompt: "Donde verias el costo de envio?", paths: [{ id: "p3", nodeIds: ["n2", "n21"], isPrimary: true }] },
];
fs.writeFileSync(process.argv[2], JSON.stringify(d));
const bad = JSON.parse(JSON.stringify(d));
bad.tasks[0].paths[0].nodeIds = ["nope"];
fs.writeFileSync(process.argv[3], JSON.stringify(bad));
' "$(cygpath -w "$TMP/tt.json")" "$(cygpath -w "$TMP/tt-doc.json")" "$(cygpath -w "$TMP/tt-bad.json")"
check "owner saves tree document"            200 "$(req a PATCH "/tree-tests/$TT_ID" "@$TMP/tt-doc.json" "$CSRF_A")"
check "unknown node in a path is 422"        422 "$(req a PATCH "/tree-tests/$TT_ID" "@$TMP/tt-bad.json" "$CSRF_A")"
check "publish tree test"                    200 "$(req a POST "/tree-tests/$TT_ID/status" '{"action":"publish"}' "$CSRF_A")"
TT_CODE="$(field publicPath | awk -F/ '{print $NF}')"
check "tree share code generated"            8 "${#TT_CODE}"
check "tree landing"                         200 "$(req c GET "/public/tree-tests/$TT_CODE")"
check "tree participant start"               201 "$(req c POST "/public/tree-tests/$TT_CODE/responses" '{}' "$CSRF_C")"
grep -q '"paths"' "$TMP/body" && check "expected paths not exposed" absent present || check "expected paths not exposed" 1 1
TT_TOKEN="$(field token)"
check "complete with unknown node is 422"    422 "$(req c POST "/public/tree-tests/$TT_CODE/complete" "{\"token\":\"$TT_TOKEN\",\"tasks\":[{\"taskId\":\"t1\",\"events\":[{\"nodeId\":\"zzz\",\"action\":\"enter\"}],\"nominatedNodeId\":\"n11\",\"durationSeconds\":10},{\"taskId\":\"t2\",\"events\":[],\"nominatedNodeId\":\"n21\",\"durationSeconds\":8}]}" "$CSRF_C")"
check "complete with missing task is 422"    422 "$(req c POST "/public/tree-tests/$TT_CODE/complete" "{\"token\":\"$TT_TOKEN\",\"tasks\":[{\"taskId\":\"t1\",\"events\":[],\"nominatedNodeId\":\"n11\",\"durationSeconds\":10}]}" "$CSRF_C")"
check "tree participant completes"           200 "$(req c POST "/public/tree-tests/$TT_CODE/complete" "{\"token\":\"$TT_TOKEN\",\"tasks\":[{\"taskId\":\"t1\",\"events\":[{\"nodeId\":\"n1\",\"action\":\"enter\"},{\"nodeId\":\"n11\",\"action\":\"enter\"}],\"nominatedNodeId\":\"n11\",\"durationSeconds\":12},{\"taskId\":\"t2\",\"events\":[{\"nodeId\":\"n1\",\"action\":\"enter\"},{\"nodeId\":\"n1\",\"action\":\"back\"},{\"nodeId\":\"n2\",\"action\":\"enter\"}],\"nominatedNodeId\":\"n21\",\"durationSeconds\":20}]}" "$CSRF_C")"
check "tree report"                          200 "$(req a GET "/tree-tests/$TT_ID/report")"
grep -q '"taskResults"' "$TMP/body" && check "report has task results" 1 1 || check "report has task results" present absent
check "tree shared with B (view)"            201 "$(req a POST "/tree-tests/$TT_ID/viewers" "{\"email\":\"$EMAIL_B\"}" "$CSRF_A")"
check "shared viewer B reads tree test"      200 "$(req b GET "/tree-tests/$TT_ID")"
check "shared viewer B cannot edit tree"     403 "$(req b PATCH "/tree-tests/$TT_ID" '{"name":"x"}' "$CSRF_B")"
check "tree close"                           200 "$(req a POST "/tree-tests/$TT_ID/status" '{"action":"close"}' "$CSRF_A")"
check "closed tree cannot start (409)"       409 "$(req c POST "/public/tree-tests/$TT_CODE/responses" '{}' "$CSRF_C")"
check "delete tree results"                  204 "$(req a DELETE "/tree-tests/$TT_ID/responses" '{"confirmName":"Smoke tree"}' "$CSRF_A")"
check "delete tree test"                     204 "$(req a DELETE "/tree-tests/$TT_ID" '{"confirmName":"Smoke tree"}' "$CSRF_A")"
check "deleted tree test is 404"             404 "$(req a GET "/tree-tests/$TT_ID")"
check "delete with wrong name is 422"        422 "$(req a DELETE "/projects/$PROJECT_ID" '{"confirmName":"nope"}' "$CSRF_A")"
check "owner deletes project"                204 "$(req a DELETE "/projects/$PROJECT_ID" '{"confirmName":"Editor edit"}' "$CSRF_A")"
check "deleted project is 404"               404 "$(req a GET "/projects/$PROJECT_ID")"

# ── Account ─────────────────────────────────────────────────────────────────
check "email change without password is 422" 422 "$(req a PATCH /account "{\"displayName\":\"Smoke A\",\"email\":\"smoke-a2-$RUN_ID@example.com\"}" "$CSRF_A")"
check "name change is 200"                   200 "$(req a PATCH /account "{\"displayName\":\"Smoke A2\",\"email\":\"$EMAIL_A\"}" "$CSRF_A")"
check "wrong current password is 422"        422 "$(req a POST /account/password '{"currentPassword":"wrong-password-000","newPassword":"another-horse-battery"}' "$CSRF_A")"
req a2 GET /auth/session >/dev/null; CSRF_A2="$(csrf_of)"
check "second session for A"                 200 "$(req a2 POST /auth/login "{\"email\":\"$EMAIL_A\",\"password\":\"correct-horse-battery\"}" "$CSRF_A2")"
check "change password"                      200 "$(req a POST /account/password '{"currentPassword":"correct-horse-battery","newPassword":"another-horse-battery"}' "$CSRF_A")"
CSRF_A="$(csrf_of)"
check "current session stays signed in"      200 "$(req a GET /projects)"
check "other session is signed out"          401 "$(req a2 GET /projects)"
check "invalid locale is 422"                422 "$(req a PATCH /account/preferences '{"locale":"xx"}' "$CSRF_A")"
check "delete account needs ELIMINAR"        422 "$(req a DELETE /account '{"currentPassword":"another-horse-battery","confirmation":"borrar"}' "$CSRF_A")"
check "delete account A"                     200 "$(req a DELETE /account '{"currentPassword":"another-horse-battery","confirmation":"ELIMINAR"}' "$CSRF_A")"
CSRF_A="$(csrf_of)"
check "deleted account is signed out"        401 "$(req a GET /projects)"
check "deleted account cannot log in"        401 "$(req a POST /auth/login "{\"email\":\"$EMAIL_A\",\"password\":\"another-horse-battery\"}" "$CSRF_A")"
check "cleanup: delete account B"            200 "$(req b DELETE /account '{"currentPassword":"correct-horse-battery","confirmation":"ELIMINAR"}' "$CSRF_B")"

rm -rf "$TMP"
echo "Passed: $PASS  Failed: $FAIL"
[ "$FAIL" -eq 0 ]
