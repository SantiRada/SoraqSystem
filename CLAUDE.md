# Soraq — instrucciones para agentes

Soraq es un UX workspace para diseñadores que trabajan con IA. React + TS (Vite) + **HeroUI v3 / Tailwind v4** en `frontend/`, PHP + MySQL en `backend/`. **Producto nativo en español** (UI y mensajes del API); código, identificadores y slugs en inglés. Documentación en `docs/`.

## Antes de tocar código
1. Leer `docs/README.md` y los documentos del área afectada (PRODUCT, GUIDELINES, ARCHITECTURE, BRAND, SECURITY_AUDIT).
2. Si la tarea es un módulo nuevo: seguir `docs/ARCHITECTURE.md §16` y copiar el patrón de `docs/modules/projects.md`.
3. Seguir `docs/WORKFLOW.md`: REQUEST → UNDERSTAND → LOCATE → PLAN → IMPLEMENT → TEST (mínimo) → DOCUMENT → FINAL REVIEW.

## Reglas no negociables
- **Modificar solo los archivos estrictamente necesarios.** Nada de refactors no pedidos. No tocar archivos globales (tokens, base.css, router salvo montar rutas, httpClient, `backend/src/Core`, `.htaccess`) para resolver problemas locales.
- **Seguridad en el backend**: `RequireAuth` + `CurrentUser::from()` + repositorio con scope en SQL + Policy + 404 uniforme. Nunca ids de usuario desde el request. Nunca SQL concatenado.
- **Nunca secretos** en código, git ni variables `VITE_*`.
- **Nunca** modificar https://soraq.app ni conectarse a su base de datos. Todo en localhost.
- Migraciones: forward-only, nunca editar una ya aplicada.
- UI: componentes de `@/design-system` (nunca `@heroui/*` directo), solo tokens semánticos (`bg-surface`, `text-muted`…), WCAG 2.2 AA, modo oscuro y claro, todos los estados.
- Textos: nunca inline; `useI18n().t()` + `i18n/locales/es/<feature>.ts`; en PHP, claves de `backend/lang/es` (`docs/I18N.md`).
- Navegación del proyecto: `/_SITEMAP.md` + `features/workspace/config/projectNavigation.ts` (`docs/NAVIGATION.md`). Sin sidebar fuera de proyecto.
- Rol `admin` = solo administración de plataforma, nunca bypass de ownership. `debug@debug.com` es solo local.
- Features se importan solo por su `index.ts` (`@/features/<x>`).
- **No auditar ni revisar exhaustivamente cada función nueva** (sin informes en `docs/audits/`, sin recorrer el checklist, sin pruebas de navegador extensas). La auditoría completa la lanza el usuario con la skill `/auditoria` tras varios cambios. Durante el desarrollo: solo la verificación mínima de `docs/WORKFLOW.md §4`, aplicando igualmente las reglas de seguridad y diseño al escribir el código.
- Actualizar `CHANGELOG.md` y docs afectados. Si cambia una decisión: nuevo ADR en `docs/decisions/` (no sobrescribir el anterior).

## Verificación mínima (por función)
```bash
cd frontend && npm run typecheck && npm run lint && npm run build
bash backend/tests/smoke/api-smoke.sh --reset-rate-limits   # si se tocó el backend (solo local)
```
Más una pasada rápida del flujo principal. La revisión completa es `/auditoria`.

## Entorno local
- Frontend: http://localhost:5173 (`npm run dev` en `frontend/`), proxy `/api` → `http://localhost/SoraqSystem/backend/public`.
- PHP CLI: `C:\xampp\php\php.exe`. Migraciones: `php backend/bin/migrate.php`. Cuenta debug (admin): `php backend/bin/seed-debug-user.php` → `debug@debug.com` / `debug1234`.
- En Windows, editar archivos con herramientas que preserven UTF-8 (no `Get-Content`/`Set-Content` de PowerShell 5.1: corrompen caracteres como `’` y `…`).
