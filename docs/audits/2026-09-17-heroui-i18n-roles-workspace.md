# Auditoría de seguridad — HeroUI, i18n, roles y workspace de proyecto (v0.2.0)

| | |
|---|---|
| Fecha | 2026-09-17 |
| Responsable | Claude (asistente de desarrollo) — pendiente revisión humana |
| Motivo | Cambios de arquitectura frontend, autorización (rol admin), base de datos (migraciones 4–5), mensajes del API, routing |
| Versión | 0.2.0 (sin commit) |

## Alcance
- **Backend:** `Core/I18n/Translator`, `HttpException`, `ErrorHandler`, `Validator`, `Application`, `Services`, `Modules/Auth/RequireAdmin`, `Modules/Users` (role), `bin/seed-debug-user.php`, `lang/es/*`, migraciones `000004_add_role_to_users`, `000005_default_locale_es`.
- **Frontend:** migración a HeroUI v3 + Tailwind v4, `src/i18n`, `shared/theme` + `public/theme-init.js`, `AppLayout` (sin sidebar), feature `workspace` (rutas `/app/projects/:id/:section/:item`), `AccountMenu`, `SignOutButton`, lint rules.
- **Datos:** usuario local `demo.designer@example.com` convertido en `debug@debug.com` (rol admin).

## Checklist

| Área | Resultado | Notas |
|---|---|---|
| 4.1 Authentication | OK | Sin cambios de flujo. Login debug verificado vía API y UI |
| 4.2 Authorization | OK | Rutas de workspace dependen de `GET /projects/{id}` (scope + policy intactos) |
| 4.2b Roles | OK con riesgo aceptado | `role` solo por migración/seeder; `RequireAdmin` → 404; admin no altera scope de proyectos. Riesgo: cuenta debug débil (ver hallazgo 1) |
| 4.3 IDOR | OK | URL de proyecto ajeno en el workspace → "Proyecto no encontrado" (404 del API); sección/ítem inexistente → estado "Esta sección no existe" sin llamadas extra |
| 4.4 Database | OK | Migraciones solo DDL + UPDATE de default de locale |
| 4.5 API | OK | Contratos iguales; nuevos `role` en perfil propio y `Content-Language` |
| 4.6 Información expuesta | OK | `role` solo del propio usuario |
| 4.9 Secretos | OK | Nada nuevo en `VITE_*`; `APP_LOCALE` no es secreto |
| 4.10 Frontend exposure | OK | `localStorage` solo `soraq-theme`; sin `dangerouslySetInnerHTML`; source maps desactivados |
| 4.12 Routing | OK | Slugs validados contra `projectNavigation`; `isSafeRedirect` intacto |
| 4.14 XSS | OK | Todo texto por React; `Translator` interpola params solo en strings de servidor, respuesta JSON |
| 4.15 CSRF | OK | Sin cambios; token rotado tras login verificado (`csrf_invalid` con token viejo) |
| 4.19 Errores | OK | Mensajes en español desde `lang/es`; 500 genérico sin fugas |
| 4.20 Logs/auditoría | OK | Sin cambios |
| 4.21 Dependencias | OK | `npm audit`: 0 vulnerabilidades tras instalar HeroUI/Tailwind/React Aria |
| CSP | Informativo | React Aria usa `style` vía CSSOM (no bloqueado por `style-src 'self'`); `theme-init.js` externo; verificar en staging |

## Verificaciones ejecutadas
```
bash backend/tests/smoke/api-smoke.sh --reset-rate-limits   → Passed: 27  Failed: 0
GET /projects sin sesión (Accept-Language: en-US,es)        → 401 "Inicia sesión para continuar." · Content-Language: es
POST /auth/register inválido                                → 422 con mensajes por campo en español
POST /auth/login debug@debug.com / debug1234                → 200, role "admin"
php bin/seed-debug-user.php                                 → actualizado (development)
npm run typecheck / lint (jsx-a11y strict + reglas de import) / build → OK
UI: login debug, proyectos sin sidebar, workspace (resumen → sección → ítem), drawer mobile,
    sección inexistente, cambio de tema persistido, Escape en diálogo                → OK
```

## Hallazgos

| # | Severidad | Descripción | Acción | Estado |
|---|---|---|---|---|
| 1 | Alto (si llega a producción) | Cuenta `debug@debug.com` con contraseña `debug1234` y rol admin | Seeder bloqueado fuera de development; verificación obligatoria en DEPLOYMENT.md y SECURITY_AUDIT §4.2b | Mitigado (control de proceso) |
| 2 | Bajo | Pendientes de la auditoría anterior (verificación de email, reset de contraseña, purga de `rate_limits`, IP detrás de proxy) | Sin cambios | Pendiente |
| 3 | Informativo | Estilos inline de React Aria vía CSSOM | Validar CSP en staging | Pendiente (deploy) |

## Conclusión
Sin hallazgos críticos nuevos en el código. El único riesgo relevante es operativo (cuenta debug) y está cubierto por controles de proceso bloqueantes para el deploy.
