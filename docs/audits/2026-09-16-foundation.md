# Auditoría de seguridad — Fundación (v0.1.0)

| | |
|---|---|
| Fecha | 2026-09-16 |
| Responsable | Claude (asistente de desarrollo) — pendiente revisión humana |
| Motivo | Arquitectura inicial, autenticación, autorización, base de datos, API, routing |
| Versión | 0.1.0 (sin commit inicial todavía) |

## Alcance
- **Backend:** `backend/src/Core/**`, `backend/src/Modules/{Health,Auth,Users,Projects}`, `backend/config/*`, `backend/public/*`, migraciones 000001–000003, `bin/migrate.php`.
- **Frontend:** `shared/api`, `features/auth`, `features/projects`, `app/router.tsx`, `config/paths.ts`, `public/.htaccess`, `index.html`.
- **Endpoints:** `/health`, `/auth/session`, `/auth/register`, `/auth/login`, `/auth/logout`, `/projects`, `/projects/{projectId}`.
- **Tablas:** `users`, `projects`, `audit_logs`, `rate_limits`, `schema_migrations`.
- **Local:** `.htaccess` raíz (XAMPP).

## Checklist

| Área | Resultado | Notas |
|---|---|---|
| 4.1 Authentication | OK (con riesgos aceptados) | Argon2id; login uniforme; regeneración de sesión + rotación CSRF verificada (smoke). Sin verificación de email ni reset de contraseña (riesgos §6) |
| 4.2 Authorization | OK | `RequireAuth` en grupo de Projects; usuario solo desde sesión |
| 4.3 IDOR / ownership | OK | Scope en SQL + Policy; B → 404 sobre proyecto de A; no aparece en su listado; id malformado → 404 |
| 4.4 Database access | OK | Solo repositorios; PDO sin emulación; strict mode; `LIMIT 200` en listado; usuario DB con privilegios sobre `soraq_local` únicamente |
| 4.5 API endpoints | OK | JSON only (415), body ≤ 1 MB (413), 405 con `Allow`, validación con allowlist de campos |
| 4.6 Información expuesta | OK | Sin `id` interno, `owner_user_id` ni `password_hash` en respuestas (smoke) |
| 4.7 Información interna | OK | `.env`, `src`, `config`, `storage`, `bin`, migraciones, dotfiles → 403 vía HTTP |
| 4.8 Información de usuarios | OK | Solo perfil propio expuesto; emails normalizados |
| 4.9 Secretos / env | OK | `.env` en `.gitignore`; único acceso a `import.meta.env` en `config/env.ts` con variables públicas |
| 4.10 Frontend exposure | OK | Sin source maps en build; sin `dangerouslySetInnerHTML`; `localStorage` solo para tema |
| 4.11 Backend exposure | OK | Solo `public/index.php`; `bin/migrate.php` rechaza SAPI no-CLI |
| 4.12 Routing | OK | Guards + 404; `isSafeRedirect`; params backend restringidos por regex; slashes codificados rechazados por Apache |
| 4.13 SQL injection | OK | Sin concatenación de input (scan + revisión) |
| 4.14 XSS | OK | React escapa; CSP prod `script-src 'self'`; API `nosniff` + CSP `default-src 'none'`; descripción `<script>` almacenada como texto |
| 4.15 CSRF | OK | Global sin opt-out; Origin extranjero → 403; falta de token → 403; SameSite=Lax |
| 4.16 Sesiones | OK | `HttpOnly; SameSite=Lax`; `Secure` + `__Host-` activados por config en HTTPS; strict mode; timeouts |
| 4.17 Rate limiting | OK | Login bloquea al 6.º intento (429 verificado); registro y creación de proyectos limitados |
| 4.18 File uploads | N/A | No existen |
| 4.19 Mensajes de error | OK | 500 genérico con `requestId` (PDOException con credenciales no se filtra — verificado) |
| 4.20 Logging / audit | OK | Redacción de claves sensibles verificada; eventos auth.* y project.created registrados |
| 4.21 Dependencias | OK | `npm audit --omit=dev`: 0 vulnerabilidades. Backend sin dependencias de terceros |

## Verificaciones ejecutadas

```
bash backend/tests/smoke/api-smoke.sh            → Passed: 27  Failed: 0
7 logins fallidos consecutivos                   → 401 ×5, 429 ×2
curl .env / src / config / storage / bin / .htaccess / docs → 403
POST body 1.1 MB                                 → 413 payload_too_large
POST '{bad' / '["a"]' / tipos array              → 400 / 400 / 422 (sin warnings PHP)
ErrorHandler con PDOException (prod)             → 500 genérico, sin SQL ni credenciales
Logger con password/csrfToken anidado            → [redacted]
npm audit --omit=dev                             → 0 vulnerabilities
npm run lint (jsx-a11y strict) / typecheck       → 0 errores
dist/assets/*.map                                → 0
```

## Hallazgos

| # | Severidad | Descripción | Acción | Estado |
|---|---|---|---|---|
| 1 | Medio | Sin verificación de email ni recuperación/cambio de contraseña | Implementar antes del lanzamiento público | Aceptado (riesgo §6) |
| 2 | Bajo | El registro revela si un email existe | Rate limit por IP; revisar al implementar verificación de email | Aceptado |
| 3 | Bajo | `rate_limits` sin purga periódica | Tarea programada / purga oportunista | Pendiente |
| 4 | Bajo | Rate limit basado en `REMOTE_ADDR`; en producción detrás de proxy podría agrupar usuarios | Verificar cabeceras de Hostinger en deploy | Pendiente (deploy) |
| 5 | Informativo | XAMPP local expone versión de Apache/PHP en páginas de error y escucha en todas las interfaces | Solo desarrollo; opcional `ServerTokens Prod` y `Listen 127.0.0.1:80` | Aceptado |
| 6 | Informativo | `GET /auth/session` crea una sesión para visitantes anónimos (necesaria para el token CSRF) | Aceptado; el GC limpia sesiones | Aceptado |

## Conclusión

Sin hallazgos críticos ni altos. La base cumple el modelo **authentication + authorization + ownership + scoped access** y está lista para desarrollar módulos. Los hallazgos 1, 3 y 4 son **bloqueantes para producción**, no para el desarrollo local.
