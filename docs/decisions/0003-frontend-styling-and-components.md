# 0003 — CSS Modules + design tokens; componentes propios

| | |
|---|---|
| Estado | Reemplazada por [0007](0007-heroui-tailwind-design-system.md) (2026-09-17) |
| Fecha | 2026-09-16 |

## Contexto
Soraq necesita una identidad visual propia (referencia de criterio: shadcn/ui, sin copiarlo), dark mode por defecto, accesibilidad WCAG 2.2 AA y estilos que se puedan modificar por módulo sin efectos globales. CSP estricta en producción.

## Decisión
- **Tokens CSS** en tres capas (primitivos → semánticos por tema → foundation).
- **CSS Modules** co-ubicados con cada componente.
- **Componentes propios** sobre HTML nativo accesible (`<dialog>`, `<button>`, `<label>`), exportados desde `@/design-system`.
- Iconos: lucide-react. Fuente: Inter Variable self-hosted.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Tailwind + shadcn/ui | Acelera, pero empuja hacia la estética shadcn y dispersa decisiones de diseño en clases; menos control de tokens semánticos |
| CSS-in-JS | Runtime + conflicto con CSP `style-src 'self'` |
| Radix Primitives desde ya | No hay todavía menús/combobox/popovers; se incorporará cuando existan (nuevo ADR), manteniendo la API de `@/design-system` |

## Consecuencias
- ✔ Cero runtime de estilos, temas por CSS, estilos aislados por componente, identidad propia.
- ✘ Componentes complejos (combobox, menús, date pickers) requerirán una primitiva accesible externa.
