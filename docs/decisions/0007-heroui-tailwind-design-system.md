# 0007 — HeroUI v3 + Tailwind CSS v4 como base del design system

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |
| Reemplaza a | [0003](0003-frontend-styling-and-components.md) |

## Contexto
Se redefinió la estética del producto: **HeroUI en dark mode**, con Framer y Google Antigravity como referencias visuales (canvas casi negro, tipografía display, acento azul eléctrico, botones pill). La decisión 0003 (CSS Modules + componentes propios) ya no refleja la dirección de producto.

## Decisión
- **HeroUI v3** (`@heroui/react`, React Aria por debajo) como librería de componentes.
- **Tailwind CSS v4** (requisito de HeroUI v3) para layout y estilos; se eliminan los CSS Modules.
- Tokens = **variables semánticas de HeroUI** (`--background`, `--surface`, `--muted`, `--accent`…) sobrescritas con la marca en `design-system/styles/theme.css`, en tema oscuro (default) y claro.
- `@/design-system` se mantiene como **fachada**: los features importan UI solo desde ahí (regla ESLint que prohíbe `@heroui/*` y `react-aria-components` fuera de `design-system`).
  - Componentes **envueltos** (Button, TextField, Dialog, Alert, Badge, EmptyState…) agregan i18n, accesibilidad y variantes Soraq (p. ej. `contrast` = pill blanco).
  - Componentes **re-exportados** tal cual (Card, Avatar, Dropdown, Drawer, Chip, Separator, Spinner).
- React Aria `RouterProvider` en `RootLayout` para navegación cliente desde componentes HeroUI.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Mantener CSS Modules y "imitar" HeroUI | Duplica trabajo y pierde la accesibilidad de React Aria |
| HeroUI v2 | Versión anterior; v3 es la estable actual y usa Tailwind v4 |
| shadcn/ui | La referencia pedida es HeroUI |

## Consecuencias
- ✔ Componentes accesibles (teclado, foco, lectores de pantalla) listos: menús, drawers, modales.
- ✔ Tema claro/oscuro solo cambiando variables.
- ✘ Dependencias nuevas: `@heroui/react`, `@heroui/styles`, `react-aria(-components)`, `tailwindcss`, `@tailwindcss/vite` (+ `tailwind-merge`/`tailwind-variants` transitivas).
- ✘ Bundle mayor (~117 KB gzip del chunk compartido). Aceptado; revisar con code splitting si crece.
- ✘ `Tooltip.Trigger` de HeroUI envuelve con un `div role="button"` enfocable → no se usa sobre links (se creó `RailLink` con etiqueta propia accesible).
- ⚠ React Aria posiciona overlays con `style` inline vía CSSOM (permitido por CSP `style-src 'self'`). Verificar en staging.

## Reemplazo de 0003
1. **Por qué cambió:** nueva dirección estética definida por producto (HeroUI dark).
2. **Afecta:** `frontend/src/design-system/**`, estilos de todos los features y layouts, `vite.config.ts`, `eslint.config.js`, `package.json`.
3. **No afecta:** backend, API, rutas, lógica de features, i18n de datos, seguridad.
4. **Archivos:** design-system (componentes + `styles/`), `features/**/components|pages`, `app/layouts/*`, `main.tsx`.
5. **Evitar modificaciones innecesarias:** la API pública de `@/design-system` se mantuvo lo más parecida posible (cambios: `onClick`→`onPress`, `loading`→`isLoading`, `onChange(value)`).
