# Módulo: Projects — módulo de referencia

| | |
|---|---|
| Tipo | PLATFORM |
| Área | Workspace |
| Estado | Disponible (mínimo, v0.1.0) |
| Backend | `backend/src/Modules/Projects/` |
| Frontend | `frontend/src/features/projects/` |

## Propósito
El proyecto es la **raíz del contexto** de todo el trabajo UX en Soraq. Esta versión mínima (listar, crear, ver) existe además como **implementación de referencia** del patrón *authentication + authorization + ownership + scoped access* que deben copiar todos los módulos.

## Contexto de proyecto
| Consume | Produce |
|---|---|
| Usuario autenticado | `project` (nombre, descripción) — contenedor del contexto que agregarán los módulos futuros |

## Datos
Tabla `projects` ([DATABASE.md](../DATABASE.md#projects)). Borrado del usuario ⇒ borrado de sus proyectos.

## Endpoints
| Método | Path | Auth | Permiso | Rate limit | Descripción |
|---|---|---|---|---|---|
| GET | `/projects` | ✔ | propios | — | Hasta 200, orden `updated_at DESC` |
| POST | `/projects` | ✔ | — | 60/h por usuario | `{ name (≤120), description? (≤2000) }` → 201 |
| GET | `/projects/{projectId}` | ✔ | `canView` | — | 404 si no existe, sin acceso o id inválido; incluye `accessRole` |
| PATCH | `/projects/{projectId}` | ✔ | `canUpdate` (owner, editor) | — | `{ name, description }`; 403 para viewer |
| DELETE | `/projects/{projectId}` | ✔ | `canDelete` (owner) | — | `{ confirmName }` exacto |
| GET | `/projects/{projectId}/members` | ✔ | `canView` | — | Owner + miembros (id público, nombre, email, rol) |
| POST | `/projects/{projectId}/members` | ✔ | `canManageMembers` (owner) | 30/h | `{ email, role }`; solo cuentas existentes |
| PATCH | `/projects/{projectId}/members/{userId}` | ✔ | `canManageMembers` | — | `{ role }` |
| DELETE | `/projects/{projectId}/members/{userId}` | ✔ | owner o `canLeave` sobre sí mismo | — | Quitar acceso / salir |

## Permisos
| Acción | Quién | Policy |
|---|---|---|
| Ver proyecto y miembros | Owner, editor, viewer | `canView` |
| Actualizar nombre/descripción | Owner, editor | `canUpdate` |
| Gestionar acceso | Owner | `canManageMembers` |
| Eliminar | Owner | `canDelete` |
| Salir del proyecto | Editor, viewer | `canLeave` |

Modelo y decisiones: [ADR 0011](../decisions/0011-project-sharing-roles.md). La UI vive en **Configuración** del workspace ([workspace.md](workspace.md)).

## Patrón (copiar en módulos nuevos)
```
routes.php        grupo con AuthModule::requireAuth($services)
Controller        CurrentUser::from($request) → service
Service           valida (Validator) · rate limit · repo con scope · policy · audit
Repository        WHERE public_id = :id AND owner_user_id = :owner
Policy            reglas de acceso por acción
Entity            toPublicArray() sin ids internos
```

## UI
- Rutas: `/app/projects` (listado en `AppLayout`, sin sidebar). El detalle de un proyecto vive en el feature **workspace** ([workspace.md](workspace.md)).
- Design system: `PageHeader`, `Button`, `Card`, `Dialog`, `TextField`, `TextAreaField`, `Alert`, `EmptyState`, `LoadingState`, `ButtonLink`.
- Componentes propios: `ProjectCard`, `CreateProjectDialog`.
- API pública del feature: `projectsApi`, tipo `Project`, `projectRoutes`.

## Estados
| Estado | Cuándo | Cómo se muestra |
|---|---|---|
| loading | Carga de la lista | `LoadingState` con texto específico |
| empty | Sin proyectos | `EmptyState` + "Nuevo proyecto" (el botón del header se oculta para no duplicar la acción primaria) |
| error | Red/servidor | `Alert` danger + "Reintentar" |
| not found / sin acceso | 404 | Lo resuelve el workspace: "Proyecto no encontrado" |
| success (creación) | Tras crear | Navega al resumen del proyecto (workspace) + `Alert` success "Proyecto creado" |
| validación | 422 / nombre vacío | Error bajo el campo + foco |

## Auditoría
`project.created`, `project.updated`, `project.deleted`, `project.member_added`, `project.member_role_changed`, `project.member_removed`, `project.left`.

## Tests
Smoke: creación, lectura propia, **B no puede leer A (404)**, **A no aparece en listado de B**, id malformado → 404, sin ids internos en respuesta.

## Próximos pasos previstos
Editar / eliminar (con confirmación y `project.updated` / `project.deleted`), núcleo de contexto (etapa 1 de [PRODUCT.md](../PRODUCT.md#11-roadmap-conceptual)).

## Historial
| Fecha | Cambio |
|---|---|
| 2026-09-17 | HeroUI + español; la página de detalle pasa al feature workspace |
| 2026-09-16 | Versión inicial (listar, crear, ver) |
