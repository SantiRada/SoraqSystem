# Soraq — Arquitectura de navegación

> Fuente de verdad del contenido: [`/_SITEMAP.md`](../_SITEMAP.md). Implementación: `frontend/src/features/workspace/config/projectNavigation.ts`. Decisiones: [ADR 0010](decisions/0010-project-workspace-navigation.md), actualizada por [ADR 0014](decisions/0014-single-collapsible-sidebar-item-switcher.md) (un solo sidebar).

## 1. Dos contextos

| Contexto | Ruta | Navegación |
|---|---|---|
| **Sin proyecto seleccionado** | `/app/projects` | **Sin sidebar.** Esquina superior izquierda: logo + nombre del producto. Esquina superior derecha: usuario, cambio de modo (claro/oscuro) y **Cerrar sesión**, flotantes |
| **Dentro de un proyecto** | `/app/projects/:projectId/…` | Un sidebar (expandido o rail, a elección del usuario) + barra de ítems en páginas de nivel 3 |

## 2. Niveles del sitemap

```
PLANEAR                 ← Nivel 1: etiqueta NO cliqueable (divide bloques en el sidebar principal)
 ├─ Investigación       ← Nivel 2: ítem cliqueable del sidebar principal (con ícono)
 │   ├─ Desktop Research   ← Nivel 3: lo que se puede crear (página de sección + barra de ítems)
 │   └─ …
 └─ Navegación
     ├─ Arquitectura    ← Nivel 3 con hijos: etiqueta NO cliqueable (subgrupo)
     │   └─ Card Sorting   ← Nivel 4: lo que se puede crear
```

| Nivel | Dónde aparece | Interacción |
|---|---|---|
| 1 — Grupo | Sidebar principal (expandido: texto en mayúsculas pequeñas; rail: separador) | No cliqueable |
| 2 — Sección | Sidebar principal (expandido: ícono + texto; rail: solo ícono con etiqueta al hover/foco) | Cliqueable → `/:projectId/:sectionId` |
| 3 con hijos — Subgrupo | Página de sección y barra de ítems (etiqueta) | No cliqueable |
| 3 sin hijos / 4 — Ítem | Grilla de la página de sección y barra de ítems (ItemSwitcher) | Cliqueable → `/:projectId/:sectionId/:itemId` |

## 3. Estados del workspace

El sidebar es el mismo en todas las pantallas del proyecto: **expandido** (w-64: logo + botón contraer, "Todos los proyectos", nombre del proyecto, "Resumen del proyecto", grupos y secciones, menú de cuenta) o **rail de íconos** (4.5rem: logotipo, botón expandir, secciones, menú de cuenta). El usuario alterna con el botón junto al logo; la preferencia se guarda por dispositivo (default: expandido).

| Pantalla | Contenido |
|---|---|
| Resumen del proyecto (`/:projectId`) | Mapa de secciones + detalles |
| Sección (`/:projectId/:sectionId`) | "Qué puedes crear aquí": botones a cada ítem (con subgrupos) |
| Ítem (`/:projectId/:sectionId/:itemId`) | **Barra de ítems** (ItemSwitcher) flotante arriba a la izquierda con los ítems de la sección (activo marcado) + espacio del ítem (módulo) |
| Configuración (`/:projectId/settings/{general,access,delete}`) | Barra de links General · Acceso · Eliminar proyecto + formularios |
| < 1024 px | Barra superior (menú + proyecto · sección) y drawer con el sidebar expandido; la barra de ítems también aparece |

Estado activo: fondo + peso + ícono en acento, y `aria-current="page"` (nunca solo color).

## 4. Accesibilidad

- Cada bloque es un `<nav>` con nombre: "Navegación del proyecto", "Contenido de {sección}" (barra de ítems).
- Botón contraer/expandir: nombre accesible, `aria-expanded`, `aria-controls`; el foco permanece en el botón tras alternar.
- Grupos y subgrupos: listas con `aria-labelledby` (en el rail, `aria-label` en la lista).
- Rail: cada link tiene `aria-label`; la etiqueta visual aparece con **hover y foco de teclado**, se cierra con Escape y no captura el puntero (WCAG 1.4.13).
- Estado de ítems: ícono + texto oculto para lectores ("Sin empezar"), no solo color. Los ítems con módulo disponible (Producto, Context Prompt) muestran su propio ícono y no llevan estado.
- Tras navegar, el foco va al `<h1>` de la página (`useRouteFocus`).
- Drawer móvil: foco contenido, Escape, cierre al navegar.

### Configuración del proyecto (menú de cuenta)
No está en el sidebar: se abre desde el **menú de cuenta** (avatar) con "Configuración del proyecto", opción visible solo dentro de un proyecto (`AccountMenu projectSettingsHref`). Cada página muestra una barra de links (`SettingsNav`) entre:

| Ítem | Contenido | Permisos |
|---|---|---|
| General | Nombre y descripción | Editar: owner, editor · Ver: viewer |
| Acceso | Personas con acceso; dar acceso por email, cambiar rol, quitar acceso; salir del proyecto | Gestionar: owner |
| Eliminar proyecto | Confirmar escribiendo el nombre; salir del proyecto para no-owners | Eliminar: owner |

### Atajos de teclado (dentro de un proyecto)
| Atajo | Acción |
|---|---|
| Ctrl+1 … Ctrl+9, Ctrl+0 (alias Alt+{n}) | Sección de nivel 2 n.º 1–9 y 10 en el orden del sidebar (la 11.ª, Documentación, no tiene atajo) |
| Shift+1 … Shift+9, Shift+0 | Ítem de nivel 3 n.º 1–10 de la sección abierta (orden de la página de sección, subgrupos aplanados) |

Se usa `event.code` (independiente del layout). No actúan con diálogos, drawer o menús abiertos; Shift y Alt no actúan mientras se escribe en un campo. **Chrome/Edge reservan Ctrl+1…9 para cambiar de pestaña** y no los entregan a la página: en esos navegadores usar Alt+{n}.

### Módulos con rutas propias
| Ítem | Rutas |
|---|---|
| Card Sorting | `navigation/card-sorting` (lista) · `navigation/card-sorting/:studyId` (dashboard) · público `/cardsorting/:slug/:code` · lectura compartida `/app/shared/card-sorting/:studyId` |
| Producto · Context Prompt | `research/product` · `documentation/context-prompt` |

## 5. Cómo cambiar la navegación

1. Editar `/_SITEMAP.md` (acuerdo de producto).
2. Reflejarlo en `features/workspace/config/projectNavigation.ts` (id = slug en inglés estable; ícono para secciones).
3. Agregar los textos en `frontend/src/i18n/locales/es/workspace.ts`.
4. Verificar: `npm run typecheck` (claves), recorrido con teclado, mobile.
5. **No renombrar slugs existentes** sin redirección: rompen enlaces guardados.

## 6. Cómo monta un módulo su contenido

Un módulo (ej. Card Sorting) reemplaza el placeholder del ítem registrando una ruta más específica **antes** de la genérica en `features/workspace/routes.tsx`, por ejemplo `:sectionId/card-sorting/*` → página del módulo, y obtiene el proyecto con `useWorkspace()`. Ver [ARCHITECTURE.md §16](ARCHITECTURE.md#16-cómo-agregar-un-módulo-ejemplo-card-sorting).
