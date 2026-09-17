# Soraq — Seguridad y auditorías

> **Regla del proyecto:** la auditoría completa se ejecuta **manualmente con la skill `/auditoria`** (`.claude/skills/auditoria/`) después de un conjunto de cambios grandes y **siempre antes de un deploy**. No se audita cada función por separado. Nada se despliega con cambios de §2 sin auditar.
> Última revisión: 2026-09-17 · Última auditoría: [2026-09-17 — Proyectos compartidos, cuenta y facturación](audits/2026-09-17-sharing-account-billing.md)

## 1. Principios

1. **El backend decide.** Ocultar una ruta, un botón o un dato en el frontend **no es seguridad**.
2. **Authentication + authorization + resource ownership + scoped access** en todo recurso privado.
3. **Deny by default:** configuración ausente ⇒ comportamiento de producción; CSRF sin opt-out; rutas nuevas sin middleware ⇒ `CurrentUser` falla cerrado.
4. **Mínimo privilegio:** usuario de DB limitado a su base, solo `backend/public` expuesto a la web, datos mínimos en respuestas.
5. **Defensa en profundidad:** SameSite + CSRF token + verificación de Origin; scope en SQL + Policy; IDs no enumerables + autorización.
6. **Nunca exponer internos:** SQL, stack traces, rutas, ids internos, secretos, datos de otros usuarios.
7. **Secretos fuera del código y del frontend.**
8. **Trazabilidad:** acciones sensibles quedan en `audit_logs`.

## 2. Cuándo ejecutar `/auditoria`

La lanza el equipo manualmente al cerrar un bloque de trabajo que incluya cualquiera de estos cambios (y siempre antes de desplegar):
- Cambios importantes de **arquitectura**.
- Cambios en **autenticación** (login, registro, sesiones, contraseñas, OAuth, 2FA).
- Cambios en **autorización** (roles, permisos, ownership, workspaces, políticas).
- **Modificaciones de base de datos** (nuevas tablas/columnas con datos de usuario, cambios de scope).
- **Nuevas funcionalidades extensas** (un módulo nuevo).
- **Nuevas integraciones** (Figma, proveedores de IA, MCP, webhooks).
- Cambios en **billing** (pagos, suscripciones, códigos, comisiones).
- Cambios en el **manejo de información privada** (exportaciones, archivos, participantes).
- Incorporación de **APIs** (endpoints nuevos o modificados).
- Cambios de **routing** (frontend o backend, `.htaccess`).
- Antes de **cada deploy a producción**.

## 3. Procedimiento

Automatizado en la skill `/auditoria` (ver `.claude/skills/auditoria/SKILL.md`). Pasos:

1. Alcance: todo lo modificado desde la última auditoría (`scripts/scope.sh`).
2. Chequeos automáticos (`scripts/automated-checks.sh`).
3. Checklist completo (`references/checklist.md`, que incluye este §4) marcando **OK / N/A / Hallazgo**, matriz de acceso por endpoint y recorrido en navegador.
4. Informe en `docs/audits/YYYY-MM-DD-<tema>.md` a partir de `docs/audits/_TEMPLATE.md`.
5. Clasificar hallazgos: **Crítico / Alto / Medio / Bajo / Informativo**.
6. Críticos y Altos se corrigen **antes** de merge/deploy. Medios con fecha. Bajos documentados.
7. Actualizar §6 (riesgos conocidos) si se acepta un riesgo, con justificación.
8. Registrar la auditoría en `CHANGELOG.md` (sección Security).

## 4. Checklist

### 4.1 Authentication
- [ ] Contraseñas con `PasswordHasher` (Argon2id/bcrypt); nunca hash propio, nunca reversible.
- [ ] Longitud mínima 12, máxima 256; sin reglas de composición arbitrarias; se permite pegar.
- [ ] Mensaje de login idéntico para email inexistente / contraseña incorrecta / cuenta inactiva.
- [ ] Rate limit en login y registro (y en recuperación de contraseña cuando exista).
- [ ] `session_regenerate_id` + rotación CSRF en login, registro, logout y cambio de privilegios.
- [ ] Logout invalida la sesión en el servidor.
- [ ] Usuario recargado desde DB en cada request autenticada (estado `active`).

### 4.2 Authorization / access control
- [ ] Todo endpoint privado está dentro de un grupo con `RequireAuth`.
- [ ] El usuario se obtiene **solo** con `CurrentUser::from($request)`.
- [ ] Ningún `user_id`, `owner_id`, `role` o `workspace_id` se acepta desde el cliente para decidir acceso.
- [ ] Las Policies cubren cada acción (view/update/delete/…).
- [ ] Sin escalada de privilegios: un usuario no puede modificar su propio rol/plan/estado vía API.

### 4.2b Roles de plataforma
- [ ] Endpoints de administración con `RequireAuth` + `RequireAdmin` (404 a no-admins).
- [ ] Ninguna ruta acepta `role` desde el cliente; el rol solo cambia por migración/CLI.
- [ ] `admin` **no** otorga lectura de proyectos/datos ajenos (ownership intacto).
- [ ] Acciones admin auditadas como `admin.*`.
- [ ] La cuenta `debug@debug.com` **no existe** en staging/producción (`SELECT id FROM users WHERE email = 'debug@debug.com'` → vacío).

### 4.3 IDOR / resource ownership
- [ ] Toda consulta de un recurso privado incluye el scope en SQL (`AND owner_user_id = :owner` o membresía).
- [ ] No existen métodos de repositorio sin scope para datos de usuario.
- [ ] Recurso ajeno, inexistente o id malformado ⇒ **mismo 404**.
- [ ] Recursos anidados validan la cadena completa (estudio ∈ proyecto ∈ usuario).
- [ ] Probado con dos usuarios: B no puede **leer, listar, modificar ni borrar** recursos de A.

### 4.4 Database access
- [ ] Solo repositorios acceden a `Database`.
- [ ] 100% prepared statements; ningún input concatenado. Identificadores dinámicos (ORDER BY, columnas) solo desde **allowlist**.
- [ ] `LIMIT` en listados.
- [ ] Usuario de DB con privilegios mínimos; credenciales solo en `.env`.
- [ ] Migraciones revisadas: FKs, índices, `ON DELETE` coherente con privacidad.

### 4.5 API endpoints
- [ ] Endpoint documentado (ARCHITECTURE §6 + ficha del módulo) con método, auth y permisos.
- [ ] Validación con `Validator` (solo campos declarados; límites de longitud).
- [ ] JSON obligatorio en métodos que modifican estado; límite de tamaño de body.
- [ ] Respuestas con `toPublicArray()`; sin campos extra.
- [ ] Métodos no soportados ⇒ 405.

### 4.6 Información expuesta (respuestas, HTML, bundle)
- [ ] Sin ids internos, hashes, tokens, emails de terceros ni metadatos internos en respuestas.
- [ ] Sin datos de otros usuarios (incluso en errores de validación).
- [ ] `/health` no revela versiones, entorno ni estado de DB.

### 4.7 Información interna
- [ ] Logs, `storage/`, `config/`, `src/`, `.env`, migraciones **no** accesibles por HTTP (probar URLs directas).
- [ ] Sin listados de directorio (`Options -Indexes`).
- [ ] Headers sin `X-Powered-By` / versiones.

### 4.8 Información de usuarios
- [ ] Datos personales mínimos necesarios.
- [ ] Emails normalizados y únicos; no expuestos a otros usuarios.
- [ ] Exportaciones/archivos solo al propietario.
- [ ] Retención definida para datos nuevos (DATABASE.md §5).

### 4.9 Secretos y variables de entorno
- [ ] Ningún secreto en el código, en git, ni en `VITE_*`.
- [ ] `.env` fuera del web root en producción, permisos 600.
- [ ] `APP_DEBUG=false` y `APP_ENV=production` en producción.
- [ ] Secretos rotados si se sospecha exposición.

### 4.10 Frontend exposure
- [ ] `grep -r "VITE_" frontend/src` solo encuentra configuración pública.
- [ ] Sin `dangerouslySetInnerHTML` (lint lo bloquea); si fuera imprescindible: sanitización + ADR.
- [ ] Sin source maps en producción (`build.sourcemap: false`).
- [ ] Sin tokens/sesión en `localStorage` (solo preferencias no sensibles, ej. tema).
- [ ] Guards de ruta tratados como UX, con el backend verificado aparte.

### 4.11 Backend exposure
- [ ] Solo `public/index.php` accesible; resto del backend fuera del web root.
- [ ] `bin/` rechaza ejecución no-CLI.
- [ ] Endpoints de depuración inexistentes en producción.

### 4.12 Routing
- [ ] Rutas nuevas del frontend protegidas por el guard correcto y con 404 de fallback.
- [ ] Redirecciones solo a destinos internos (`isSafeRedirect`); nunca a URLs recibidas por query sin allowlist.
- [ ] Parámetros de ruta backend restringidos por el patrón del router; ids validados (ULID).
- [ ] `.htaccess` revisado: fallback SPA no expone archivos, `/api` enruta al front controller.

### 4.13 SQL injection
- [ ] Ver 4.4. Buscar concatenaciones: `grep -rn '\$.*\. *\$' backend/src --include=*Repository.php` y revisar manualmente.

### 4.14 XSS
- [ ] React escapa por defecto; sin HTML crudo.
- [ ] URLs de usuario en `href`/`src` validadas (solo `https:`), nunca `javascript:`.
- [ ] CSP de producción activa (`script-src 'self'`, sin inline).
- [ ] API responde `application/json` + `nosniff` (no interpretable como HTML).
- [ ] Contenido de usuario que se exporte a HTML/Markdown se escapa.

### 4.15 CSRF
- [ ] `VerifyCsrf` global activo; sin excepciones no documentadas.
- [ ] Cookie `SameSite=Lax`; `VerifyOrigin` con `APP_ALLOWED_ORIGINS` correcto por entorno.
- [ ] Ningún GET modifica estado.
- [ ] Endpoints públicos sin sesión (futuro: participantes) documentan su protección alternativa.

### 4.16 Session security
- [ ] Cookie `HttpOnly`, `Secure` + `__Host-` en HTTPS, `SameSite=Lax`, `Path=/`.
- [ ] `use_strict_mode=1`, solo cookies, sin SID en URL.
- [ ] Timeouts de inactividad y absoluto vigentes.
- [ ] Almacenamiento de sesiones aislado (`storage/sessions`, no legible por web).

### 4.17 Rate limiting
- [ ] Endpoints sensibles o costosos con límite (auth, creación masiva, IA, envío de emails, exportaciones, participantes).
- [ ] Límites en `config/rate_limits.php`; respuestas 429 con `Retry-After`.
- [ ] Claves por IP y por cuenta cuando aplica; claves hasheadas.

### 4.18 File uploads (cuando existan)
- [ ] Allowlist de tipos validada por contenido (magic bytes), no por extensión ni `Content-Type`.
- [ ] Tamaño máximo por archivo y cuota por usuario/plan.
- [ ] Nombre de almacenamiento aleatorio; nombre original solo como metadato escapado.
- [ ] Guardados **fuera del web root** (`storage/uploads`) y servidos por un endpoint con autorización.
- [ ] `Content-Disposition: attachment` para tipos no seguros; nunca servir SVG/HTML subido inline.
- [ ] Sin ejecución: `.htaccess` deniega PHP en carpetas de archivos.
- [ ] Escaneo antimalware si se aceptan documentos de terceros (participantes).

### 4.19 Error messages
- [ ] Solo `HttpException` llega al cliente; 500 genérico con `requestId`.
- [ ] Mensajes nuevos como **claves** en `backend/lang/<locale>`; los parámetros interpolados nunca incluyen datos de otros usuarios ni internos.
- [ ] Diferenciados: usuario (422), permisos (403/404), sesión (401), red (cliente), inexistente (404), no disponible (503/UI).
- [ ] Sin stack traces, SQL, rutas, nombres de clases (salvo `debug` local).

### 4.20 Logging y audit logs
- [ ] Logs técnicos sin contraseñas, tokens, cookies ni bodies completos (`Logger` redacta claves sensibles).
- [ ] `storage/logs` no accesible por HTTP; rotación/retención definida.
- [ ] Acciones sensibles registradas con `AuditLogger` (ver §5.2).
- [ ] `metadata` de auditoría sin datos sensibles ni contenido privado.

### 4.21 Dependencias y verificaciones automáticas
```bash
cd frontend && npm audit --omit=dev          # sin altas/críticas
cd frontend && npm run lint && npm run typecheck
bash backend/tests/smoke/api-smoke.sh        # CSRF, Origin, IDOR, 401/404/405/415/422
```
- [ ] Nuevas dependencias justificadas en ARCHITECTURE §2 (mantenimiento activo, licencia, tamaño).
- [ ] Versiones fijadas por `package-lock.json` (commit obligatorio).

## 5. Controles implementados (v0.1.0)

### 5.1 Mapa de controles

| Control | Implementación |
|---|---|
| Hash de contraseñas | `Core/Security/PasswordHasher.php` (Argon2id, rehash, dummy verify anti-timing) |
| Sesión segura | `Core/Security/SessionManager.php`, `config/session.php` |
| CSRF | `Core/Security/Csrf.php`, `Core/Http/Middleware/VerifyCsrf.php` (global) |
| Origin check | `Core/Http/Middleware/VerifyOrigin.php` (global) |
| Rate limiting | `Core/Security/RateLimiter.php`, `config/rate_limits.php` |
| Autenticación de rutas | `Modules/Auth/RequireAuth.php`, `CurrentUser.php` |
| Rol admin | `Modules/Auth/RequireAdmin.php`, `users.role`, `User::isAdmin()` |
| Mensajes localizados sin fugas | `Core/I18n/Translator.php` (nombres de archivo validados), `backend/lang/` |
| Cuenta debug solo local | `bin/seed-debug-user.php` (aborta si `APP_ENV` ≠ development) |
| Ownership / scoped access | `Modules/Projects/ProjectRepository.php` + `ProjectPolicy.php` + `ProjectService::getFor` (404 uniforme) |
| IDs no enumerables | `Core/Support/Ulid.php` (`public_id`) |
| Validación / mass-assignment | `Core/Validation/Validator.php` |
| SQL injection | `Core/Database/Database.php` (PDO, prepares reales, strict mode) |
| Errores seguros | `Core/Errors/ErrorHandler.php`, `Core/Http/HttpException.php` |
| Headers API | `Core/Http/Response.php` (CSP `default-src 'none'`, nosniff, DENY, no-store, HSTS en HTTPS) |
| Headers frontend prod | `frontend/public/.htaccess` (HTTPS, HSTS, CSP, Permissions-Policy, Referrer-Policy) |
| Aislamiento local | `.htaccess` raíz (deny all) + `backend/public/.htaccess` |
| Logs redactados | `Core/Logging/Logger.php` |
| Auditoría | `Core/Audit/AuditLogger.php`, tabla `audit_logs` |
| Límite de body / JSON only | `Core/Http/Request.php` |
| Open redirect | `frontend/src/config/paths.ts → isSafeRedirect` |
| XSS (lint) | `eslint.config.js` bloquea `dangerouslySetInnerHTML` |

### 5.2 Eventos de auditoría

| Acción | Estado |
|---|---|
| `auth.registered` | ✔ |
| `auth.login` | ✔ |
| `auth.login_failed` (sin email en claro) | ✔ |
| `auth.logout` | ✔ |
| `project.created` | ✔ |
| `project.updated`, `project.deleted` | ✔ |
| `project.member_added`, `project.member_role_changed`, `project.member_removed`, `project.left` | ✔ |
| `account.profile_updated`, `account.email_changed`, `account.password_changed`, `account.preferences_updated`, `account.deleted` | ✔ |
| `auth.password_reset_requested` | Al implementar |
| `card_sort.created`, `.updated`, `.publish`, `.pause`, `.resume`, `.close`, `.deleted`, `.responses_deleted`, `.viewer_added`, `.viewer_removed` | ✔ |
| `product_note.*`, `context_prompt.generated` | ✔ |
| `study.results_exported` | Al implementar |
| `billing.subscription_changed`, `billing.code_redeemed` | Al implementar |
| `admin.*` (toda acción administrativa) | Al implementar |
| Acceso a información sensible (exportaciones de datos) | Al implementar |

## 6. Riesgos conocidos y decisiones aceptadas

| Riesgo | Severidad | Decisión | Revisar |
|---|---|---|---|
| El registro revela si un email ya existe | Bajo | Aceptado por usabilidad; mitigado con rate limit por IP. Revertir a respuesta genérica cuando exista verificación de email | Al implementar verificación de email |
| Sin verificación de email (incluye: dar acceso a un correo registrado por otra persona, cambio de correo sin verificar) | Medio | Aceptado para desarrollo. **Requerido antes de producción pública** (ADR 0011, 0012) | Pre-lanzamiento |
| Dar acceso por email revela si una cuenta existe (usuarios autenticados) | Bajo | Rate limit 30/h por usuario | Invitaciones verificadas |
| Colaboradores ven nombre y email de los demás miembros del proyecto | Bajo | Necesario para colaborar; solo dentro del proyecto | — |
| Sin recuperación / cambio de contraseña | Medio | Pendiente. Al implementarlo: token de un uso, expiración corta, invalidar otras sesiones | Pre-lanzamiento |
| Rate limit por `REMOTE_ADDR` (detrás de proxy/CDN todos comparten IP) | Medio | Configurar lista de proxies confiables si Hostinger/CDN reenvía IPs | Deploy |
| Rate limit de ventana fija (permite ráfagas en el borde) | Bajo | Aceptado | — |
| Sesiones en archivos: sin "cerrar todas las sesiones" | Bajo | Aceptado; migrar a sesiones en DB cuando se necesite | Cambio de contraseña |
| Tabla `rate_limits` sin purga automática | Bajo | Tarea programada pendiente | Pre-lanzamiento |
| SPA "soft 404" (HTTP 200) | Informativo | `noindex` en la 404 | SEO |
| Sin 2FA | Medio | Evaluar para cuentas con billing/equipos | Etapa equipos |
| Cuenta debug con contraseña débil conocida (`debug@debug.com` / `debug1234`, rol admin) | Alto **si llegara a producción** · Bajo en local | Seeder solo en development; verificación obligatoria pre-deploy (§4.2b y DEPLOYMENT.md) | Cada deploy |
| React Aria/HeroUI aplican estilos inline vía CSSOM para overlays | Informativo | Permitido por CSP (`style-src 'self'` no bloquea CSSOM); verificar en staging | Deploy |
| Endpoints públicos de participación (card sorting) aceptan envíos anónimos | Medio | Rate limit por IP, token por sesión, validación contra snapshot, sin datos personales. Evaluar CAPTCHA/antibots si hay abuso | Pre-lanzamiento |
| Respuestas `in_progress` abandonadas se acumulan | Bajo | Purga programada pendiente | Pre-lanzamiento |
| Enlaces de participante adivinables por fuerza bruta (código de 8 caracteres, 31^8) | Bajo | Rate limit por IP en inicio; estudio en borrador no es accesible | — |
| Apache local escucha en todas las interfaces (XAMPP) | Bajo (solo dev) | `.htaccess` raíz deniega todo; recomendable `Listen 127.0.0.1:80` en `httpd.conf` | — |

## 7. Qué NO hacer

- ❌ Confiar en el frontend para autorizar (ocultar botones/rutas no protege nada).
- ❌ Leer `user_id`, `owner_id`, `role`, `plan` o `price` desde el request para decidir acceso o cobro.
- ❌ Usar `admin` como bypass del ownership ("los admins ven todo").
- ❌ Crear la cuenta debug o correr `seed-debug-user.php` fuera de development.
- ❌ Escribir mensajes de error como texto dentro del código PHP (usar claves `lang`).
- ❌ Crear un `findById()` sin scope para datos de usuario "porque es más cómodo".
- ❌ Responder 403 "no es tuyo" para recursos ajenos (revela existencia) → 404.
- ❌ Concatenar input en SQL, incluso "solo para ORDER BY".
- ❌ Exponer `id` autoincremental, `password_hash`, tokens o metadatos internos en el API.
- ❌ Poner secretos en `VITE_*`, en el repo, en logs o en mensajes de error.
- ❌ Guardar tokens de sesión o datos sensibles en `localStorage`.
- ❌ Usar `dangerouslySetInnerHTML` o renderizar HTML de usuario.
- ❌ Desactivar CSRF "para un endpoint" sin alternativa documentada.
- ❌ Hacer cambios de estado con GET.
- ❌ Activar `APP_DEBUG` en producción o mostrar `display_errors`.
- ❌ Loguear contraseñas, tokens, cookies o bodies completos.
- ❌ Guardar uploads dentro del web root o servirlos sin autorización.
- ❌ Agregar dependencias sin revisar mantenimiento, licencia y vulnerabilidades.
- ❌ Editar migraciones ya aplicadas.
- ❌ Trabajar contra la base de datos o el sitio de producción desde localhost.
- ❌ Desplegar sin backup, sin smoke test o sin auditoría.

## 8. Respuesta a incidentes (mínimo)

1. **Contener:** desactivar el módulo afectado (quitar de `config/modules.php`) o poner modo mantenimiento.
2. **Preservar evidencia:** copiar `storage/logs` y consultar `audit_logs` por `request_id`/actor/fechas.
3. **Rotar** credenciales/secretos potencialmente expuestos; invalidar sesiones (vaciar `storage/sessions`).
4. **Corregir** y auditar el fix.
5. **Notificar** a usuarios afectados según la normativa aplicable (GDPR: 72 h a la autoridad si aplica).
6. **Documentar** en `docs/audits/` (post-mortem) y CHANGELOG.
