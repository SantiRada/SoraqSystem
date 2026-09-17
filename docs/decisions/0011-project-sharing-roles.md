# 0011 — Proyectos compartidos: roles owner / editor / viewer

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |
| Amplía a | [0005](0005-ownership-scoped-access-and-public-ids.md) |

## Contexto
Configuración del proyecto debe mostrar y gestionar **usuarios con acceso**. Hasta ahora el acceso era solo del owner.

## Decisión
- Tabla `project_members(project_id, user_id, role)` con roles `editor` y `viewer`. El **owner no es una membresía**: sigue siendo `projects.owner_user_id`.
- Scope de acceso en SQL: owner **o** membresía (`LEFT JOIN project_members`). La misma consulta resuelve `accessRole` del usuario actual y se expone en el API.
- Permisos en `ProjectPolicy`:

| Acción | owner | editor | viewer |
|---|:-:|:-:|:-:|
| Ver proyecto y personas con acceso | ✔ | ✔ | ✔ |
| Editar nombre/descripción | ✔ | ✔ | |
| Dar / cambiar / quitar acceso | ✔ | | |
| Eliminar proyecto (confirmando el nombre) | ✔ | | |
| Salir del proyecto | | ✔ | ✔ |

- Sin acceso ⇒ **404**; con acceso pero sin permiso ⇒ **403** (la existencia ya es conocida).
- Solo se puede dar acceso a **cuentas existentes** (no hay envío de emails todavía). Mensaje explícito si no existe la cuenta, limitado a 30 intentos/hora por usuario.
- Rol `admin` de plataforma no otorga nada aquí ([0009](0009-platform-roles-and-debug-account.md)).

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Workspaces/organizaciones con membresía | Sobreconstrucción para compartir proyectos individuales; migrable después |
| Invitaciones por email pendientes | Requiere envío de emails y **verificación de email** (si no, cualquiera registrando ese correo obtiene acceso) |
| Respuesta genérica al invitar (anti-enumeración) | El listado de miembros revelaría el resultado igualmente; se mitiga con rate limit |

## Consecuencias
- ✔ Colaboración real sin cambiar URLs ni contratos existentes (solo se agrega `accessRole`).
- ✘ Enumeración de emails registrados para usuarios autenticados (acotada por rate limit).
- ✘ Emails no verificados: alguien podría registrar el correo de otra persona antes que ella y recibir acceso por error del owner. **Bloqueante antes de producción:** verificación de email.
- Afecta: `Modules/Projects/*`, migración 000007, `features/projects`, `features/workspace` (Configuración). No afecta: auth, billing, design system.
