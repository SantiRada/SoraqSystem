# 0005 — Acceso por ownership con scope en SQL e IDs públicos ULID

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-16 |

## Contexto
Regla crítica del producto: un usuario nunca debe poder acceder a datos de otro cambiando un id en la URL (IDOR). Soraq crecerá hacia workspaces y roles.

## Decisión
1. Identidad solo desde la sesión (`CurrentUser`).
2. Repositorios con **scope incluido en el SQL**; no existen búsquedas sin scope para datos de usuario.
3. **Policy** por entidad, consultada en el service (defensa en profundidad y punto de extensión para roles).
4. Inexistente / ajeno / malformado ⇒ **mismo 404**.
5. `public_id` ULID en API y URLs; `id` autoincremental solo interno.
6. **Projects** es el módulo de referencia de este patrón.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Solo check en controller (`if owner != user`) | Fácil de olvidar; el dato ajeno ya se leyó |
| UUIDv4 | No ordenable por tiempo; ULID es más compacto en URLs |
| 403 para recursos ajenos | Revela existencia |

## Consecuencias
- ✔ IDOR bloqueado en dos capas; migración a workspaces cambia solo Repository + Policy.
- ✘ Algo de repetición en repositorios (aceptada: explícita y auditable).
