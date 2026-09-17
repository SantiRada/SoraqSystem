# 0014 — Un solo sidebar colapsable por el usuario + barra de ítems de nivel 3

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |
| Reemplaza a | [0010](0010-project-workspace-navigation.md) (solo el segundo sidebar y el colapso automático) |

## Contexto
Las páginas de sección (nivel 2) ya muestran botones hacia sus ítems (nivel 3), así que el sidebar secundario duplicaba esa navegación y ocupaba 16rem de ancho. Producto pidió quitarlo, dejar el colapso del sidebar principal a elección del usuario y ofrecer una forma de moverse entre ítems de nivel 3 sin volver a la sección.

## Decisión
- **Un solo sidebar** (grupos y secciones). Se elimina `SectionNav`.
- **Colapso manual**: botón a la derecha del logo (expandido) o debajo del logotipo (rail). Preferencia por dispositivo en `localStorage` (`soraq-sidebar-collapsed`, no sensible); por defecto expandido. El foco queda en el botón tras alternar.
- **ItemSwitcher**: barra flotante superior, alineada a la izquierda y fija al hacer scroll, que aparece **solo en páginas de nivel 3** con los ítems de la misma sección (subgrupos como etiquetas no interactivas; scroll horizontal si no caben).
- Mobile (< 1024 px): drawer con el sidebar expandido; el ItemSwitcher también aparece.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Mantener el segundo sidebar | Duplica los botones de la página de sección y resta ancho al contenido |
| Solo breadcrumb "← Sección" | Obliga a volver a la sección para cambiar de ítem (dos clics) |
| Menú desplegable de ítems | Oculta las opciones (reconocer antes que recordar) |

## Consecuencias
- Positivas: más ancho para el contenido; navegación de nivel 3 a un clic; el usuario decide la densidad del sidebar.
- Negativas / costos: la preferencia no se sincroniza entre dispositivos.

## Si esta decisión reemplaza a otra
1. **Por qué cambió:** pedido de producto (duplicación con las páginas de sección).
2. **Partes afectadas:** `ProjectWorkspaceLayout`, `PrimaryNav`, nuevo `ItemSwitcher` y `useSidebarCollapsed`; se borra `SectionNav`.
3. **Partes NO afectadas:** `projectNavigation.ts`, rutas, páginas de sección/ítem, módulos, backend.
4. **Archivos que deben modificarse:** los anteriores + `IconButton` (prop `id`), catálogo `workspace.ts`, docs de navegación.
5. **Cómo se evitan modificaciones innecesarias:** la configuración de navegación y las páginas no cambian; solo el shell.
