# 0001 — SPA con Vite + API PHP en el mismo origen

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-16 |

## Contexto
Stack obligatorio: React + TypeScript en frontend, PHP + MySQL en backend, todo en el mismo hosting (Hostinger compartido, soraq.app). Hostinger compartido no ofrece un runtime Node persistente.

## Decisión
- Frontend como **SPA construida con Vite**, servida como archivos estáticos por Apache desde `public_html/`.
- Backend PHP con front controller en `public_html/api/`, código fuera del web root.
- **Mismo origen** (`soraq.app` y `soraq.app/api`). En desarrollo, el proxy de Vite replica ese esquema.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Next.js (SSR) | Requiere Node en producción |
| Next.js `output: export` | Pierde SSR/RSC/API routes; agrega complejidad sin beneficio frente a Vite |
| API en subdominio | Obliga a CORS y cookies cross-site; más superficie de error |

## Consecuencias
- ✔ Deploy simple (copiar archivos), sin CORS, cookies `SameSite` efectivas, paridad dev/prod.
- ✘ SEO de páginas públicas depende de JS (ver [SEO.md](../SEO.md#3-limitación-conocida-spa)); se resolverá con prerender si hace falta.
