# Soraq — Flujo de trabajo y gestión de cambios

> Cómo se trabaja en este repositorio. Aplica a personas y a agentes de IA.

## 1. Flujo de desarrollo

```
REQUEST → UNDERSTAND → LOCATE → PLAN → IMPLEMENT → TEST (mínimo) → DOCUMENT → FINAL REVIEW
                                 … varias funciones …
                                 → /auditoria (manual, lo lanza el equipo)
```

| Paso | Qué hacer |
|---|---|
| **Request** | Leer el pedido completo. Identificar si es producto, UI, seguridad, datos o infraestructura |
| **Understand** | Leer PRODUCT / GUIDELINES / ARCHITECTURE / SECURITY_AUDIT y la ficha del módulo si existe |
| **Locate** | ¿Dónde pertenece? (feature/módulo, design system, shared, core) |
| **Plan** | Responder las preguntas de la sección 2 |
| **Implement** | Cambios mínimos, siguiendo la anatomía de módulos existente |
| **Test** | Verificación mínima (sección 4) |
| **Audit** | **No** se hace por cada función. Se ejecuta la skill `/auditoria` manualmente tras un conjunto de cambios grandes o antes de un deploy (sección 7) |
| **Document** | CHANGELOG + docs afectados + ficha del módulo |
| **Final review** | Revisar el diff completo: ¿algún archivo tocado sin necesidad? |

## 2. Antes de implementar una funcionalidad

Responder por escrito (en la ficha del módulo o en el PR):

- ¿Dónde pertenece? ¿Qué depende de ella y de qué depende?
- ¿Qué **contexto de proyecto** consume y produce?
- ¿Qué archivos necesita? ¿Qué datos y tablas?
- ¿Qué endpoints? ¿Qué permisos (quién puede ver/crear/editar/borrar)?
- ¿Qué estados de UI (loading, empty, error, permission denied, success…)?
- ¿Qué errores posibles y cómo se comunican?
- ¿Qué impacto en seguridad, accesibilidad, rendimiento y SEO?

## 3. Regla de modificación segura

> **Modificar únicamente los archivos estrictamente necesarios para resolver la tarea.**

1. Identificar el módulo.
2. Identificar dependencias.
3. Identificar archivos afectados.
4. Revisar arquitectura.
5. Revisar documentación.
6. Modificar lo mínimo necesario.
7. Probar.
8. Revisar efectos secundarios.
9. Actualizar documentación si corresponde.

**Prohibido sin justificación escrita:**
- Refactors grandes "porque queda más limpio".
- Cambiar la arquitectura existente.
- Modificar archivos **globales** para resolver problemas **locales**.

**Archivos globales** (tocarlos exige justificar el impacto transversal en el PR/CHANGELOG):
`design-system/styles/*` (theme.css, base.css), `design-system/components/*`, `i18n/*.ts` (salvo agregar textos en `locales/`), `shared/theme/*`, `app/router.tsx` (salvo montar rutas nuevas), `app/layouts/*`, `features/workspace/layout/*`, `features/workspace/config/projectNavigation.ts` (solo junto con `_SITEMAP.md`), `shared/api/httpClient.ts`, `backend/lang/*` (solo agregar claves), `backend/src/Core/**`, `backend/config/*` (salvo agregar módulo o límite), `.htaccess`, `vite.config.ts`, `eslint.config.js`, migraciones existentes (nunca se editan).

## 4. Verificación mínima antes de dar algo por terminado

Durante el desarrollo de cada función solo se exige que el código **compile y funcione**; la revisión exhaustiva (seguridad, accesibilidad, responsive, i18n, SEO, documentación) la hace `/auditoria` (sección 7).

```bash
cd frontend && npm run typecheck && npm run lint && npm run build
bash backend/tests/smoke/api-smoke.sh --reset-rate-limits   # si se tocó el backend
```
- Comprobar que el flujo principal nuevo funciona (una pasada rápida, sin recorrer el checklist completo).
- No generar informes en `docs/audits/` por cada función.
- Seguir aplicando las reglas de diseño y seguridad **al escribir** el código (scope en SQL, policies, i18n, tokens, accesibilidad): la auditoría verifica, no sustituye escribir bien.

## 5. Git

### Ramas
| Rama | Uso |
|---|---|
| `main` | Siempre desplegable. Solo entra vía merge revisado |
| `feature/<modulo>-<descripcion>` | Funcionalidad nueva |
| `fix/<descripcion>` | Corrección |
| `security/<descripcion>` | Correcciones de seguridad (prioridad) |
| `docs/<descripcion>` | Solo documentación |
| `release/vX.Y.Z` | Opcional: estabilización previa a producción |

### Commits
- **Conventional Commits**: `feat(projects): add project detail page`, `fix(auth): rotate csrf token on logout`, `docs: …`, `refactor(…)`, `test(…)`, `chore(…)`, `security(…)`.
- Un commit = un cambio entendible. Evitar commits gigantes; separar migración, backend y frontend si ayuda a revisar.
- Nunca commitear `.env`, dumps, `storage/` ni `dist/`.

### Releases
- SemVer: `MAJOR.MINOR.PATCH`. Mientras `0.x`, MINOR puede romper compatibilidad interna.
- Tag anotado `vX.Y.Z` en `main` + sección en CHANGELOG.
- Deploy según [DEPLOYMENT.md](DEPLOYMENT.md); rollback = redeploy del tag anterior + restauración de DB si hubo migraciones.

## 6. Gestión de cambios y decisiones

### CHANGELOG
Cada cambio relevante se registra en `CHANGELOG.md` bajo `[Unreleased]` (Added / Changed / Fixed / Security / Removed / Docs).

### Decisiones de arquitectura (ADR)
Las decisiones importantes viven en `docs/decisions/NNNN-titulo.md` ([plantilla](decisions/_TEMPLATE.md)).

**Cuando una decisión cambia, NO se sobrescribe el ADR original.** Se crea uno nuevo que lo reemplaza y se marca el anterior como `Superseded by NNNN`. El nuevo ADR debe:

1. Documentar la nueva decisión.
2. Explicar **por qué** cambió.
3. Explicar **qué partes afecta**.
4. Explicar **qué partes NO afecta**.
5. Identificar los **archivos que deben modificarse**.
6. Evitar modificaciones innecesarias (alcance explícito).

Luego actualizar ARCHITECTURE.md (u otro doc) para reflejar el estado vigente, con link al ADR.

### Fichas de módulo
Cada módulo tiene `docs/modules/<modulo>.md` ([plantilla](modules/_TEMPLATE.md)) que se actualiza junto con el código.

## 7. Auditorías (skill `/auditoria`)

La auditoría completa se ejecuta **manualmente**, cuando el equipo lo decide:
- después de terminar **varias funciones** o un cambio grande,
- antes de **cada deploy** (obligatorio),
- después de cambios de autenticación, autorización, base de datos, billing o integraciones, cuando se cierre ese bloque de trabajo.

Uso: escribir `/auditoria` (opcionalmente con un tema: `/auditoria card sorting`).

Qué hace (definido en `.claude/skills/auditoria/`):
1. Prepara el entorno local (Apache, MySQL, dev server, migraciones).
2. Calcula el alcance: todo lo modificado desde la última auditoría (`scripts/scope.sh`).
3. Ejecuta ~30 chequeos automáticos (`scripts/automated-checks.sh`, `i18n-audit.mjs`, `contrast.mjs`).
4. Recorre el checklist completo (`references/checklist.md`, ~90 puntos: build, autenticación, autorización/IDOR, API y datos, protección web, UX, accesibilidad WCAG 2.2, responsive y temas, i18n/SEO, arquitectura y documentación), incluida la matriz de acceso por endpoint y el recorrido en navegador.
5. Corrige hallazgos Críticos y Altos; lista el resto.
6. Escribe el informe en `docs/audits/` y actualiza `SECURITY_AUDIT.md` y `CHANGELOG.md`.
