# 0004 — Autenticación con sesiones PHP + CSRF token

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-16 |

## Contexto
SPA y API en el mismo origen ([0001](0001-spa-vite-with-php-api-same-origin.md)). Se requiere protección contra XSS, CSRF, session fixation y revocación inmediata.

## Decisión
- Sesión PHP nativa en cookie `HttpOnly`, `SameSite=Lax`, `Secure` + `__Host-` en HTTPS, strict mode, timeouts de inactividad y absoluto, almacenamiento en `backend/storage/sessions`.
- **Synchronizer token** CSRF en sesión, enviado por la SPA en `X-CSRF-Token`, obligatorio globalmente para métodos que cambian estado + verificación de `Origin`.
- Regeneración de ID y rotación del token en login/registro/logout.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| JWT en localStorage | Robable por XSS; revocación compleja |
| JWT en cookie | Mismo riesgo CSRF que sesiones, más complejidad y peor revocación |
| Sesiones en DB desde ya | Innecesario hoy; se adoptará para "cerrar todas las sesiones" |

## Consecuencias
- ✔ Sin tokens accesibles a JavaScript; revocación inmediata; simple.
- ✘ Escalado horizontal requeriría sesiones compartidas (DB/Redis) — no aplica en el hosting actual.
