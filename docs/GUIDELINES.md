# Soraq — Guías de UX/UI

> Cómo se diseña y construye la interfaz. Complementa [BRAND.md](BRAND.md) (identidad), [NAVIGATION.md](NAVIGATION.md) (arquitectura de navegación), [I18N.md](I18N.md) (textos) y [ARCHITECTURE.md](ARCHITECTURE.md) (implementación).
> Última revisión: 2026-09-17

## 1. Filosofía y referencias

- **Base:** [HeroUI v3](https://heroui.com) en **dark mode** (modo claro disponible). Componentes sobre React Aria: accesibilidad de teclado, foco y lectores de pantalla incluidas.
- **Referencias estéticas:** **Framer** (canvas casi negro, ventanas de producto con brillo, tipografía grande) y **Google Antigravity** (tipografía display de peso medio, botones pill, campo de puntos). Home además: **Dropbox Dash** (hero centrado, marquee de herramientas, paneles de funcionalidad grandes).
- Son referencias de **criterio y atmósfera**, no para copiar: Soraq mantiene su marca (logo, azul eléctrico, voz).

Orden de prioridad cuando hay conflicto: 1. Usabilidad · 2. Accesibilidad · 3. Legibilidad · 4. Aprendizaje rápido · 5. Claridad · 6. Consistencia · 7. Feedback · 8. Affordance · 9. Jerarquía · 10. Reducción de carga cognitiva.

> La estética premium **nunca** justifica bajar contraste, ocultar affordances o agregar fricción.

**Evitar:** glassmorphism excesivo (blur solo en barras flotantes y overlays) · texto gris ilegible · botones ambiguos · iconos sin etiqueta · animaciones que estorban · decoración que compite con el contenido · densidad excesiva.

## 2. Accesibilidad (requisito estructural)

Objetivo mínimo **WCAG 2.2 AA**; AAA cuando no perjudica (texto principal ≥ 16:1 en ambos temas).

| Área | Regla | Implementación |
|---|---|---|
| Contraste texto | ≥ 4.5:1; cuerpo ≥ 7:1 | Ver §6 |
| Contraste no-texto | Bordes de campos y foco ≥ 3:1 | `--field-border`, `--focus` |
| Foco | Siempre visible | HeroUI + `base.css` |
| Teclado | Todo operable; sin trampas salvo modales | React Aria |
| Navegación SPA | Foco al `<h1 data-page-heading>` tras navegar | `useRouteFocus` |
| Lectores de pantalla | HTML semántico primero; ARIA solo cuando falta | Landmarks, `nav` con nombre, `aria-current` |
| Motion | `prefers-reduced-motion` desactiva animaciones; marquee pausable | `base.css`, `ToolsMarquee` |
| Target size | ≥ 24×24 (AA); controles principales 36–44 px | Tamaños HeroUI `sm`/`md`/`lg` |
| Formularios | Label visible, error textual + ícono, `aria-invalid`, foco al primer error | `Fields.tsx`, `focusFirstInvalid` |
| Estados | Nunca solo color | Ícono + texto + forma |
| Contenido en hover | Aparece también con foco, es descartable (Escape) y persistente | `RailLink` |
| Zoom | Usable a 200% y reflow a 320 px | Unidades rem, layouts fluidos |
| Idioma | `<html lang="es">` sincronizado | `I18nProvider` |

### Checklist por pantalla
- [ ] Un único `<h1>`; headings sin saltos.
- [ ] Landmarks con nombre cuando hay más de uno del mismo tipo.
- [ ] Orden de tabulación = orden visual; foco visible.
- [ ] `IconButton` siempre con `label`.
- [ ] Decorativos con `aria-hidden`.
- [ ] Errores anunciados y enfocables.
- [ ] 375 / 768 / 1280 / 1536 px y zoom 200%.
- [ ] Modo oscuro **y** claro.

### Patrones accesibles
| Patrón | Regla |
|---|---|
| **Dialog** (`Dialog`/HeroUI Modal) | Título conectado; foco inicial en el primer campo (`autoFocus` en el campo); **Escape y clic afuera cierran**; si hay texto escrito sin guardar, `hasUnsavedChanges` pide confirmación ("¿Descartar lo que escribiste?") en todos los cierres (Cancelar vía `footer={(requestClose) => …}`); `isDismissable={false}` solo mientras una acción está en curso |
| **Movimiento** | Nada aparece "de golpe": `.card`, `.alert`, paneles de pestañas, estados vacíos/carga y páginas usan la animación de entrada global (`base.css`, atributo `data-animate-enter`); lo que se muestra/oculta usa `Reveal` (altura + opacidad en ambos sentidos). Siempre respetar `prefers-reduced-motion` |
| **Confirmaciones** | Cerrar sesión siempre pide confirmación (`useSignOutConfirmation`); acciones destructivas con diálogo y botón `danger` |
| **Atajos de teclado** | Workspace: Ctrl+{n} (alias Alt+{n}) sección de nivel 2; Shift+{n} ítem de nivel 3 de la sección abierta (`useWorkspaceShortcuts`). Se ignoran con diálogos/menús abiertos y Shift/Alt mientras se escribe. Anunciados con `aria-keyshortcuts` y pista visual en hover/foco |
| **Menú** (`Dropdown`) | Trigger con nombre accesible; flechas, Enter, Escape (React Aria) |
| **Drawer** (mobile) | Botón con `aria-expanded`/`aria-controls`; se cierra al navegar |
| **Tooltips / etiquetas en rail** | No usar HeroUI Tooltip sobre links (anida un `div role="button"`); usar `aria-label` + etiqueta visual con hover **y** foco |
| **Marquee** | Botón de pausa (WCAG 2.2.2), pausa en hover, estático con reduced motion, duplicados `aria-hidden` |
| **Cards clicables** | Un solo link estirado (`after:absolute inset-0`), una sola parada de tabulación |

## 3. Heurísticas de usabilidad (Nielsen)

| Heurística | Aplicación |
|---|---|
| Visibilidad del estado | Loading con texto específico, barra de progreso de navegación, `isLoading` en botones, estado "Sin empezar" en ítems |
| Relación con el mundo real | Vocabulario del diseñador (Investigación, Síntesis, Handoff) |
| Control y libertad | Cancelar, Escape, "Volver", "Todos los proyectos" siempre visible en el proyecto |
| Consistencia | Un design system, tokens semánticos, mismos patrones de sidebar |
| Prevención de errores | Validación antes de enviar, `maxLength`, confirmación en acciones destructivas (futuro) |
| Reconocer antes que recordar | Etiquetas visibles, sidebar expandido en el resumen, rail con etiquetas al hover/foco |
| Flexibilidad y eficiencia | Rail de íconos para expertos; atajos estándar de teclado |
| Estética minimalista | Una acción primaria por región; secciones sin contenido no muestran sidebar secundario |
| Recuperación de errores | Mensajes con causa + solución; foco al problema |
| Ayuda | Hints persistentes, empty states que explican el valor |

## 4. Leyes de UX (cuando son relevantes)

| Ley | Uso |
|---|---|
| **Jakob** | Sidebar izquierda, menú de cuenta abajo, login convencional |
| **Fitts** | Cards completas clicables; rail de 44 px por ítem |
| **Hick** | Sin sidebar fuera de proyecto; el sidebar secundario muestra solo lo de la sección activa |
| **Miller** | Navegación agrupada en 4 bloques (Planear, Diseño, Testeos, Entregables) |
| **Doherty** | Feedback inmediato; lazy loading por página |
| **Tesler** | Soraq absorbe la complejidad del contexto y los prompts |
| **Peak-End** | Confirmación "Proyecto creado" al llegar al proyecto |
| **Von Restorff** | Un solo botón `contrast` (pill blanco) por región |
| **Serial Position** | "Resumen" primero y cuenta al final del sidebar |
| **Aesthetic-Usability** | Pulido visual consistente sin sacrificar función |
| **Zeigarnik** | Estado por ítem ("Sin empezar" → futuro: en progreso/completado) |

## 5. Tipografía

- **Inter Variable** con **optical sizing** (`opsz`): cortes display en tamaños grandes, de texto en pequeños.
- Escala Tailwind: `text-xs` (12, solo metadatos) · `text-sm` (14, UI) · `text-base` (16, cuerpo e **inputs**) · `text-lg`/`xl` · `text-3xl`/`4xl` (h1 de app) · `text-5xl`–`[5.75rem]` (display marketing).
- `.text-display`: peso 560, tracking −0.045em, interlineado 1.02 (títulos de marketing y páginas de sistema).
- Etiquetas de grupo en sidebars: `text-[11px] font-semibold uppercase tracking-wider text-muted`.
- `text-wrap: balance` en títulos, `pretty` en párrafos.

## 6. Color

Usar **solo tokens semánticos** de HeroUI (`bg-background`, `bg-surface`, `bg-surface-secondary`, `bg-default`, `text-foreground`, `text-muted`, `bg-accent`, `text-accent-soft-foreground`, `border-border`, `border-separator`, `bg-danger`…). Definidos en `design-system/styles/theme.css`.

- **Accent (azul eléctrico):** acción primaria dentro de la app, foco, ítem activo, brillos. No como fondo de grandes superficies.
- **`contrast` (pill blanco/negro):** CTA principal (estilo Framer). Máximo uno por región.
- Estados: success / warning / danger con **texto + ícono**.

### Contraste verificado (2026-09-17)

| Par | Oscuro | Claro |
|---|---|---|
| foreground / background | 19.3:1 | 17.0:1 |
| foreground / surface | 18.0:1 | 17.7:1 |
| muted / surface | 8.2:1 | 6.0:1 |
| muted / surface-secondary | 7.5:1 | 5.4:1 |
| muted / default (ítem activo) | 6.9:1 | 5.0:1 |
| texto blanco / accent (botón primary) | 4.6:1 | 5.8:1 |
| texto blanco / danger | 4.7:1 | 5.4:1 |
| link / background | 10.0:1 | 7.0:1 (sobre surface) |
| focus / background | 7.4:1 | 5.5:1 |
| field-border / fondo del campo | 3.5:1 | 3.6:1 |
| contrast pill (background sobre foreground) | 19.3:1 | 17.0:1 |

Al cambiar un color: recalcular (script OKLCH → WCAG) y actualizar esta tabla.

## 7. Espaciado, forma y layout

- Escala de Tailwind (múltiplos de 4 px). Sin valores arbitrarios salvo tamaños estructurales documentados (rail `4.5rem`, sidebars `w-64`).
- Radios: campos `--field-radius` (12 px), botones **pill** (`rounded-full`), cards `rounded-3xl`, paneles de marketing `rounded-[32px]`.
- Ancho de contenido: `max-w-6xl` (app), `max-w-7xl` (marketing).
- Superficies: `bg-surface` + `border border-border`; sombras solo en overlays (`shadow-overlay`).

## 8. Responsive

Mobile first en CSS, **desktop como dispositivo principal**.

| Breakpoint | Fuera de proyecto | Dentro de proyecto | Marketing |
|---|---|---|---|
| < 640 | Controles flotantes compactos (sin nombre de usuario) | Barra superior + drawer | Una columna, CTAs apilados |
| 640–1023 | Grilla de proyectos 2 columnas | Barra superior + drawer | Paneles apilados |
| ≥ 1024 (`lg`) | Idem | Sidebar principal (expandido o rail) + secundario | Paneles en 2 columnas |
| ≥ 1280 (`xl`) | 3 columnas | Resumen con panel de detalles lateral | Grillas amplias |

Módulos futuros: tablas → cards o scroll dentro del componente; configuradores largos → pasos + resumen; visualizaciones → alternativa en tabla.

## 9. Estados

| Estado | Cómo se comunica |
|---|---|
| default / hover / focus / active | HeroUI (`data-hovered`, `data-focus-visible`, `data-pressed`) |
| disabled | `isDisabled` + opacidad + cursor; explicación cercana si no es obvia |
| loading | Spinner + texto ("Iniciando sesión…"), `isPending`, foco conservado |
| success | `Alert` success o navegación al resultado |
| error | Texto + ícono + borde; foco al primer error |
| warning | `Alert` warning |
| empty | `EmptyState`: por qué + valor + una acción |
| selected / activo | Fondo + peso + ícono en acento + `aria-current` |
| partially selected | `aria-checked="mixed"` |
| permission denied / not found | Mensaje sin revelar datos ajenos |
| unavailable | Explicación + reintento |
| sin empezar (ítems) | Ícono `CircleDashed` + texto ("Sin empezar") |

## 10. Formularios

- `TextField`, `TextAreaField`, `PasswordField` de `@/design-system`; `onChange(value)`.
- Label visible; marcar lo **(opcional)**, no lo obligatorio; placeholder solo como ejemplo ("p. ej., …").
- `autoComplete`, `type`, `inputMode` correctos; inputs `text-base`.
- Validar al enviar; errores por campo + `Alert` general; foco al primer error.
- Botones de envío con verbo específico y texto de progreso.

## 11. Navegación

Reglas completas en **[NAVIGATION.md](NAVIGATION.md)**. Resumen:
- **Sin proyecto:** sin sidebar; logo arriba a la izquierda; usuario, modo y "Cerrar sesión" arriba a la derecha (flotantes).
- **En proyecto:** nivel 1 = etiquetas no cliqueables; nivel 2 = secciones cliqueables; al abrir una sección el sidebar principal pasa a rail de íconos y aparece el sidebar secundario con lo que se puede crear.
- Íconos siempre acompañados de nombre accesible y etiqueta visible (texto o etiqueta al hover/foco).

## 12. Componentes

`@/design-system` (fachada sobre HeroUI):

| Componente | Uso |
|---|---|
| `Button` | Variantes `contrast`, `primary`, `secondary`, `tertiary`, `outline`, `ghost`, `danger`; `isLoading`; pill |
| `ButtonLink` / `ButtonAnchor` | Navegación interna / anclas o externos con estilo de botón |
| `IconButton` | Solo ícono, `label` obligatorio |
| `TextField` · `TextAreaField` · `PasswordField` | Campos accesibles |
| `Alert` | Feedback inline (`info`, `success`, `warning`, `danger`) |
| `Badge` | Estado corto no interactivo |
| `Dialog` | Modal |
| `EmptyState` · `LoadingState` · `PageHeader` · `Logo` · `SkipLink` | Estructura y estados |
| Re-exports HeroUI: `Card`, `Avatar`, `Dropdown`, `Drawer`, `Chip`, `Separator`, `Spinner` | Uso directo con API compuesta |

Fuera del design system: `AccountMenu`, `SignOutButton` (auth), `ThemeToggle` (shared/theme), `PrimaryNav`, `SectionNav`, `RailLink` (workspace).

**Reglas:** ¿genérico? → design system; ¿de un módulo? → `features/<x>/components`. Nunca importar HeroUI directo en features (lint). Sin variantes "por las dudas".

## 13. Interacción y motion

- Transiciones cortas (150–200 ms) en color, opacidad y transform; el ancho del sidebar anima 200 ms (`motion-reduce:transition-none`).
- Loops solo en indicadores de carga y marquee (pausable).
- Brillos (`--glow-accent`) solo decorativos y detrás del contenido.

## 14. Affordance

Todo elemento interactivo comunica qué es, si está disponible, qué hará y su estado. Links en texto subrayados al hover; botones con forma pill; cards clicables con flecha y hover; etiquetas de grupo sin estilos de hover (no son interactivas).

## 15. Content design

- Español neutro con **tuteo**; frases cortas, voz activa. Ver [BRAND.md](BRAND.md#5-voz-y-tono).
- Botones: verbo + objeto ("Crear proyecto"). Títulos en sentence case.
- Términos UX estándar en inglés cuando el mercado los usa (Card Sorting, Handoff).
- Todo texto desde el catálogo i18n ([I18N.md](I18N.md)). Comillas tipográficas y elipsis (…).

## 16. Revisión de usabilidad

1. Tarea principal completable sin ayuda.
2. Heurísticas (§3).
3. Estados (§9).
4. Accesibilidad (§2).
5. Responsive (§8) y ambos temas.
6. Contenido (§15).
7. Consistencia con design system y NAVIGATION.md.
