# Módulo: Workspace de proyecto

| | |
|---|---|
| Tipo | PLATFORM |
| Área | Todas (contenedor de módulos) |
| Estado | Disponible (navegación y placeholders, v0.2.0) |
| Backend | — (usa `GET /projects/{projectId}`) |
| Frontend | `frontend/src/features/workspace/` |

## Propósito
El espacio de trabajo dentro de un proyecto: navegación de dos niveles definida en [`_SITEMAP.md`](../../_SITEMAP.md) y contexto del proyecto para todos los módulos. Reglas de interfaz: [NAVIGATION.md](../NAVIGATION.md). Decisión: [ADR 0010](../decisions/0010-project-workspace-navigation.md).

## Contexto de proyecto
| Consume | Produce |
|---|---|
| Proyecto (vía API, autorizado por ownership) | `useWorkspace()` → `{ project }` para páginas y módulos montados dentro |

## Estructura
```
features/workspace/
├── config/projectNavigation.ts   Grupos (nivel 1) → secciones (nivel 2) → ítems/subgrupos (3–4); helpers findSection/findItem/sectionItems
├── context/WorkspaceContext.ts   useWorkspace()
├── layout/ProjectWorkspaceLayout.tsx   Carga del proyecto, estados, sidebars, drawer
├── components/PrimaryNav.tsx     Sidebar principal (expandido / rail)
├── components/RailLink.tsx       Link de ícono con etiqueta accesible (hover + foco)
├── components/ItemSwitcher.tsx   Barra de ítems de nivel 3 (solo en páginas de ítem)
├── hooks/useSidebarCollapsed.ts  Preferencia expandido/rail (localStorage, por dispositivo)
├── pages/ProjectOverviewPage.tsx Resumen: mapa de secciones + detalles
├── pages/SectionPage.tsx         Sección: "Qué puedes crear aquí" / llegará pronto / no existe
├── pages/ItemPage.tsx            Espacio de contenido del ítem (placeholder de módulo)
├── routes.tsx · index.ts
```
Textos: `i18n/locales/es/workspace.ts`.

## Rutas
| Ruta | Página | Sidebars (≥ lg) |
|---|---|---|
| `/app/projects/:projectId` | Resumen | Principal expandido |
| `/app/projects/:projectId/:sectionId` | Sección | Sidebar |
| `/app/projects/:projectId/:sectionId/:itemId` | Ítem | Sidebar + barra de ítems |
| `/app/projects/:projectId/settings/{general,access,delete}` | Configuración (páginas propias en `pages/settings/`, abiertas desde el menú de cuenta) | Sidebar |
| `/app/projects/:projectId/research/product` · `/documentation/context-prompt` | Módulo [ProductContext](product-context.md) (wrappers en `pages/modules/`) | Sidebar + barra de ítems |

La sección activa se deriva del segmento de URL posterior al id del proyecto (no de `useParams`), para que las rutas estáticas de módulos también activen su sidebar.

## Permisos
Mismos que Projects: owner, editor o viewer ([ADR 0011](../decisions/0011-project-sharing-roles.md)); la UI de Configuración se adapta con `projectPermissions` (solo UX, el API decide). Proyecto sin acceso o inexistente → "Proyecto no encontrado" (404 del API). Slugs de sección/ítem inválidos → "Esta sección no existe" (validado contra la configuración, sin llamadas extra).

## Estados
| Estado | Cómo se muestra |
|---|---|
| loading | `LoadingState` "Cargando proyecto…" (pantalla completa) |
| not found | `EmptyState` h1 + "Todos los proyectos" |
| error | `Alert` + Reintentar |
| sección sin ítems | Espacio "{Sección} llegará pronto" |
| ítem | Espacio "{Ítem} llegará pronto" + badge "Sin empezar" |
| recién creado | `Alert` success "Proyecto creado" en el resumen |

## Cómo se integra un módulo
1. Crear el feature del módulo (ej. `features/card-sorting`).
2. En `workspace/routes.tsx`, agregar una ruta hija **más específica** que `:sectionId/:itemId` (ej. `navigation/card-sorting/*`) con la página del módulo.
3. Usar `useWorkspace()` para el proyecto. No duplicar la carga del proyecto.
4. Reemplazar el estado fijo "Sin empezar" cuando el módulo exponga estado real (ADR si cambia el modelo).

## Accesibilidad
`nav` con nombre por sidebar; grupos con `aria-labelledby`; rail con `aria-label` + etiqueta visual (hover/foco, Escape); `aria-current`; estado de ítems con texto oculto; drawer accesible en mobile.

## Historial
| Fecha | Cambio |
|---|---|
| 2026-09-17 | Versión inicial según `_SITEMAP.md` |
