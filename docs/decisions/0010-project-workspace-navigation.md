# 0010 — Navegación del workspace de proyecto con dos sidebars

| | |
|---|---|
| Estado | Reemplazada parcialmente por [0014](0014-single-collapsible-sidebar-item-switcher.md) (sin segundo sidebar; colapso manual) |
| Fecha | 2026-09-17 |

## Contexto
Producto definió la arquitectura de navegación dentro de un proyecto en [`/_SITEMAP.md`](../../_SITEMAP.md) y el comportamiento de la interfaz:
1. Sin proyecto seleccionado **no hay sidebar**; marca y acciones de cuenta (modo, cerrar sesión) flotan en las esquinas.
2. Nivel 1 del sitemap = etiquetas no cliqueables; nivel 2 = ítems cliqueables del sidebar; niveles inferiores = lo que se puede crear.
3. Al seleccionar un ítem de nivel 2, el sidebar principal se **colapsa a íconos** y aparece un **segundo sidebar** con su contenido.

Esto reemplaza la navegación global anterior (`config/navigation.ts` con áreas Discover/Define/…).

## Decisión
- **Fuera de proyecto** (`/app/projects`): `AppLayout` sin sidebar, controles flotantes.
- **Dentro de proyecto** (`/app/projects/:projectId/...`): feature `workspace` con `ProjectWorkspaceLayout`:
  - `/:projectId` → resumen; sidebar principal **expandido**.
  - `/:projectId/:sectionId` → sección; sidebar principal en **rail de íconos** + **sidebar secundario** (si la sección tiene contenido).
  - `/:projectId/:sectionId/:itemId` → espacio de contenido del ítem (los módulos futuros montan aquí).
  - < `lg`: barra superior + drawer con la misma navegación.
- La estructura vive como **datos** en `features/workspace/config/projectNavigation.ts`, espejo de `_SITEMAP.md`. Slugs en inglés, estables.
- El proyecto se carga una vez en el layout y se expone con `useWorkspace()` (contexto para los módulos).
- Reglas completas: [NAVIGATION.md](../NAVIGATION.md).

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Sidebar global permanente | Contradice el pedido: el contexto de navegación depende del proyecto |
| Colapso manual del sidebar | No pedido; el colapso por contexto reduce decisiones (Hick). Puede agregarse luego |
| HeroUI Tooltip en el rail | Su trigger anida un `div role="button"` enfocable alrededor del link |

## Consecuencias
- ✔ Agregar/reorganizar secciones = editar `_SITEMAP.md` + `projectNavigation.ts` + catálogo `workspace`.
- ✔ Cada módulo futuro recibe el proyecto por contexto (principio de contexto conectado).
- ✘ Los ítems muestran estado "Sin empezar" fijo hasta que existan módulos con datos.
- Afecta: `app/router.tsx`, `app/layouts/AppLayout.tsx`, `features/projects` (se quitó la página de detalle), nuevo `features/workspace`. No afecta backend ni API.
