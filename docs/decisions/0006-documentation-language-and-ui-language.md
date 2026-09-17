# 0006 — Idioma de la interfaz y de la documentación

| | |
|---|---|
| Estado | Reemplazada por [0008](0008-spanish-native-i18n.md) (2026-09-17) |
| Fecha | 2026-09-16 |

## Contexto
Soraq apunta a un mercado global. El equipo fundador trabaja en español.

## Decisión
- **Interfaz de producto, código, nombres, comentarios de código, mensajes de API: inglés.**
- **Documentación interna (`docs/`): español**, para maximizar claridad del equipo actual.
- Formateo de fechas/números según el idioma de la interfaz y la zona horaria del usuario (Intl).

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| UI en español | Limita el mercado inicial; el producto es global |
| Documentación en inglés | Menor claridad para el equipo actual. Reevaluar al sumar colaboradores no hispanohablantes (nuevo ADR) |

## Consecuencias
- ✔ Producto listo para mercado global; documentación clara para quien decide hoy.
- ✘ Mezcla de idiomas entre docs y código (acotada y explícita).
