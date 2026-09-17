---
name: auditoria
description: Auditoría completa de Soraq (seguridad, control de acceso, UX/UI, accesibilidad, responsive, i18n, SEO, arquitectura y documentación) sobre todo lo construido desde la última auditoría. Se ejecuta MANUALMENTE después de un conjunto de cambios grandes o antes de un deploy. Genera el informe en docs/audits/ y corrige los hallazgos críticos/altos.
disable-model-invocation: true
argument-hint: "[tema o alcance opcional, p. ej. 'card sorting' o 'todo']"
---

# Auditoría completa de Soraq

Eres el auditor del proyecto: Security Engineer + Accessibility Specialist + UX/UI reviewer + Software Architect.
Esta skill reemplaza las revisiones detalladas que antes se hacían después de cada función (ver `docs/WORKFLOW.md §4`).
Trabajas en **localhost**; nunca toques https://soraq.app ni su base de datos.

Argumento recibido (alcance/tema): `$ARGUMENTS` — si está vacío, audita **todo lo cambiado desde la última auditoría**.

Rutas usadas abajo:
- Skill: `.claude/skills/auditoria/`
- Proyecto: raíz del repo (`C:\xampp\htdocs\SoraqSystem`)
- Shell: usar **Bash (Git Bash)** para los scripts. No editar archivos con PowerShell `Get-Content/Set-Content` (corrompe UTF-8).

---

## Paso 0 — Preparar el entorno (no saltear)

1. Verificar que Apache y MySQL (XAMPP) respondan: `curl -s http://localhost/SoraqSystem/backend/public/health`.
   - Si no responden, iniciarlos (`C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone` y `C:\xampp\apache\bin\httpd.exe`, en segundo plano) y reintentar.
2. Verificar/lanzar el dev server del frontend (`.claude/launch.json` → `soraq-frontend`) para las pruebas en navegador.
3. Aplicar migraciones pendientes solo en local: `php backend/bin/migrate.php --status` y, si hay pendientes, `php backend/bin/migrate.php`.

## Paso 1 — Determinar el alcance

```bash
bash .claude/skills/auditoria/scripts/scope.sh
```
Lista la última auditoría, los archivos modificados desde entonces (frontend, backend, migraciones, docs) y la sección `[Unreleased]`/última versión del CHANGELOG.

Con esa salida:
- Identifica **módulos/features afectados**, **endpoints nuevos o modificados** (leer los `routes.php` tocados), **tablas/migraciones nuevas**, **rutas/páginas nuevas** y **componentes nuevos**.
- Si `$ARGUMENTS` acota un tema, prioriza ese alcance pero ejecuta igual los chequeos automáticos globales.
- Escribe un resumen del alcance (lo usarás en el informe).

## Paso 2 — Chequeos automáticos

```bash
bash .claude/skills/auditoria/scripts/automated-checks.sh
```
Ejecuta ~25 verificaciones (typecheck, lint, build, PHP, migraciones, smoke test de API con control de acceso, `npm audit`, exposición HTTP de archivos internos, SQL concatenado, XSS, secretos en `VITE_*`, colores hardcodeados, mojibake, `console.log`, archivos grandes, source maps, cuenta debug, i18n y contraste).
Scripts auxiliares que también puedes ejecutar por separado:
- `node .claude/skills/auditoria/scripts/i18n-audit.mjs` — claves sin uso, claves inexistentes, textos hardcodeados en JSX.
- `node .claude/skills/auditoria/scripts/contrast.mjs` — contraste WCAG de los tokens de `theme.css` en modo oscuro y claro.

Todo `FAIL` es un hallazgo. Todo `WARN` requiere revisión humana y decisión (hallazgo o falso positivo justificado en el informe).

## Paso 3 — Revisión manual guiada (checklist completo)

Lee `references/checklist.md` y recorre **cada punto** aplicándolo al alcance del Paso 1. Para cada punto registra: **OK / N/A / Hallazgo** con evidencia (archivo:línea, comando o captura de estado del DOM).

Obligatorio dentro de esta revisión:

### 3.1 Matriz de control de acceso (por cada endpoint nuevo o modificado)
Construye y **prueba con curl** (cookie jars separados, CSRF y `Origin: http://localhost:5173`) la matriz:

| Endpoint | Anónimo | Otro usuario sin acceso | Viewer | Editor | Owner | Admin de plataforma sin acceso |
|---|---|---|---|---|---|---|

Resultados esperados: anónimo 401 · sin acceso 404 · con acceso sin permiso 403 · permitido 2xx · admin sin acceso 404. Incluye IDs mal formados, IDs de otros recursos y bodies con campos extra (mass assignment). Si el smoke test no cubre un caso nuevo, **agrégalo** a `backend/tests/smoke/api-smoke.sh` (con limpieza de datos al final).

### 3.2 Recorrido en el navegador (Browser pane)
Para cada página/flujo nuevo, con la cuenta local `debug@debug.com / debug1234` (y una cuenta secundaria creada por API y borrada al final):
- Flujo feliz completo + errores de validación + errores de red/servidor (simular deteniendo el API si aplica) + estados vacío/cargando/sin permiso.
- Teclado: Tab/Shift+Tab/Enter/Escape; foco visible; foco inicial en diálogos; foco tras navegar al `<h1>`.
- Viewports 375, 768, 1280, 1536 (`resize_window`) sin scroll horizontal (`document.documentElement.scrollWidth`).
- Modo oscuro **y** claro.
- Consola sin errores.
- Nota: si el panel está en segundo plano, las animaciones no avanzan y las capturas fallan; usar `read_page`, `find`, `javascript_tool` y `document.getAnimations().forEach(a => a.finish())`. No confundir con bugs.

### 3.3 Documentación sincronizada
Verifica que el código y la documentación coincidan (checklist §J): CHANGELOG, ADR si cambió una decisión, fichas de `docs/modules/`, endpoints en `ARCHITECTURE.md §6`, tablas en `DATABASE.md`, `NAVIGATION.md`/`_SITEMAP.md`, `TESTING.md`, textos en `i18n` y `backend/lang`.

## Paso 4 — Clasificar y corregir

Severidades:
- **Crítico**: exposición de datos de otros usuarios, bypass de autenticación/autorización, SQLi/XSS explotable, secretos expuestos, pérdida de datos.
- **Alto**: IDOR parcial, CSRF faltante, validación ausente en backend, fallo WCAG A/AA que bloquea una tarea, build/lint/typecheck roto, smoke test fallando.
- **Medio**: fallo WCAG AA no bloqueante, estados faltantes, i18n incompleto, docs desactualizadas en contratos (API/DB).
- **Bajo / Informativo**: pulido visual, deuda menor, mejoras sugeridas.

Reglas:
- **Corregir inmediatamente** los Críticos y Altos (siguiendo la regla de modificación segura de `docs/WORKFLOW.md §3`) y volver a ejecutar los chequeos afectados.
- Medios: corregir si el cambio es pequeño y local; si no, listarlos con propuesta.
- Bajos: listarlos.
- Si una corrección implica cambiar una decisión de arquitectura o de producto, **no la hagas**: descríbela y pregunta.
- Nunca "arreglar" un hallazgo desactivando reglas de lint, tests o controles de seguridad.

## Paso 5 — Informe

1. Crea `docs/audits/YYYY-MM-DD-<tema>.md` a partir de `docs/audits/_TEMPLATE.md` (fecha de hoy; tema = `$ARGUMENTS` o un resumen del alcance). Incluye:
   - Alcance (Paso 1), resultados de los chequeos automáticos (tabla), checklist con resultado por sección, matriz de acceso, recorrido de navegador, hallazgos con severidad/acción/estado, y conclusión.
2. Actualiza el encabezado de `docs/SECURITY_AUDIT.md` ("Última auditoría") y su tabla de riesgos aceptados si corresponde.
3. Agrega una línea en `CHANGELOG.md` → `[Unreleased]` → `### Security` con el link al informe y los fixes aplicados.
4. Responde al usuario en español, breve: resultado global, hallazgos corregidos, hallazgos pendientes que requieren su decisión, y link al informe.
