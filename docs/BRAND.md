# Soraq — Marca

> Identidad, voz y uso de la marca. Implementación visual: `frontend/src/design-system/styles/theme.css`.
> Última revisión: 2026-09-17

## 1. Qué es Soraq

**Soraq es el espacio de trabajo UX para diseñar con IA.** Conecta todo el proceso —planear, diseñar, testear y entregar— en un único contexto de proyecto, y orquesta las herramientas que el diseñador ya usa.

**Lema:** *El espacio de trabajo UX para diseñar con IA.*

**Descripción corta (≤160):** Soraq conecta tu proceso UX —investigación, definición, diseño, validación y entrega— en un único contexto de proyecto, para que cada herramienta de IA parta de lo que ya sabes.

## 2. Posicionamiento

| | |
|---|---|
| **Para** | Diseñadores UX/UI y de producto que usan IA |
| **Que** | Pierden contexto y tiempo entre Figma, chats de IA, documentos y herramientas de testing |
| **Soraq es** | Un UX Operating System |
| **Que** | Mantiene el contexto del proyecto conectado a lo largo del proceso y de las herramientas |
| **A diferencia de** | Bibliotecas de prompts, herramientas de testing aisladas o chats genéricos |
| **Soraq** | Orquesta el proceso completo con método UX |

## 3. Personalidad

**Profesional · tecnológico · moderno · claro · confiable · premium · inteligente · accesible.**

| Es | No es |
|---|---|
| Un colega senior que sabe de método | Un gurú que promete magia |
| Preciso y calmo | Eufórico o urgente |
| Experto sin ser críptico | Académico o lleno de jerga |
| Premium por el cuidado del detalle | Premium por la ostentación |
| Entusiasta de la IA con criterio | Evangelista del hype |

## 4. Valores

1. **Contexto sobre ruido.** 2. **Método** (la IA potencia el proceso, no lo reemplaza). 3. **Claridad.** 4. **Acceso para todos.** 5. **Honestidad** (qué hace la IA, qué no, qué está disponible hoy). 6. **Respeto por el trabajo del diseñador.**

## 5. Voz y tono

**Idioma:** el producto es **nativo en español** ([ADR 0008](decisions/0008-spanish-native-i18n.md)): español **neutro con tuteo** ("Crea tu cuenta", "Revisa tu conexión"), comprensible en toda Latinoamérica y España. Evitar regionalismos (voseo, "vosotros", modismos locales).

**Voz (constante):** clara, directa, experta, humana.

| Contexto | Tono | Ejemplo |
|---|---|---|
| Onboarding / vacío | Alentador, orientado al valor | "Empieza tu primer proyecto" |
| Trabajo diario | Neutro, eficiente | "Proyecto creado" |
| Errores | Calmo, responsable, accionable | "No pudimos cargar tus proyectos. Reintentar." |
| Éxito | Breve | "Tu proyecto está listo." |
| Comercial | Seguro, concreto, sin presión | "Un solo espacio para todo tu proceso UX." |
| Educativo | Paciente, preciso | "Un test de preferencia muestra qué opción eligen las personas, no por qué." |

### Cómo escribir
- Frases cortas, voz activa, segunda persona ("tus proyectos"); "nosotros" cuando Soraq asume responsabilidad ("No pudimos…").
- Mayúscula solo al inicio en títulos y botones ("Crear cuenta").
- Botones: **verbo en infinitivo + objeto** ("Crear proyecto", "Cerrar sesión"); títulos y mensajes en imperativo amable ("Inicia sesión en Soraq").
- Términos de la disciplina que el mercado usa en inglés se mantienen: Card Sorting, Design System, Handoff, Benchmarking, UI Kit.
- Formatos con `Intl` (fechas, números, porcentajes: "38 %").

### Palabras que usamos
proyecto, contexto, espacio de trabajo, proceso, investigación, síntesis, navegación, diseño, testeo, entregable, estudio, insight, workflow, participantes, resultados, handoff.

### Palabras que evitamos
| Evitar | Por qué | Mejor |
|---|---|---|
| revolucionario, mágico, 10x, potenciar al máximo | Hype vacío | Describir el resultado concreto |
| simplemente, solo tienes que, fácil | Minimiza la dificultad | Omitir |
| ups, ¡oh no! | Trivializa | "Algo salió mal" |
| inválido, ilegal, fatal, abortar | Culpabiliza o alarma | "Ingresa un correo electrónico válido" |
| impulsado por IA (muletilla) | Genérico | Decir qué hace la IA |
| apalancar, sinergia | Corporativo | usar, combinar |
| enviar (genérico) | Ambiguo | Verbo específico |
| haz clic aquí | Inaccesible y vago | Texto de link descriptivo |
| vos / tenés / vosotros | Regional | Tuteo neutro |

## 6. Comunicación de errores

**Qué pasó** (sin culpar) → **cómo seguir**. Nunca detalles técnicos ni datos de terceros.

| ✘ | ✔ |
|---|---|
| "Error 500: PDOException" | "Algo salió mal de nuestro lado. Vuelve a intentarlo." |
| "Input inválido" | "Usa al menos 12 caracteres." |
| "Unauthorized" | "Inicia sesión para continuar." |
| "403: el proyecto pertenece a otro usuario" | "Este proyecto no existe o no tienes acceso a él." |
| "Network error" | "No pudimos conectar con Soraq. Revisa tu conexión y vuelve a intentarlo." |
| "Too many requests" | "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." |

## 7. Comunicación de éxito
Confirmar donde ocurre, breve ("Proyecto creado"); siguiente paso solo si agrega valor. Sin exceso de exclamaciones ni emojis en la UI.

## 8. Comunicación comercial
- Precio de referencia **US$40/mes**; anual **US$360/año** ("equivale a US$30/mes").
- Creator y Education como **descuentos sobre la referencia** ("70 % de descuento educativo").
- Sin urgencia artificial ni dark patterns; límites de uso transparentes.

## 9. Comunicación educativa
Explicar el **por qué** del método, ejemplos del trabajo real, límites de cada estudio o respuesta de IA, recomendar revisión humana.

## 10. Naming
- **Soraq**: S mayúscula, resto minúsculas. ✘ SORAQ · ✘ SoraQ · (minúsculas solo en dominio/código).
- No traducir, declinar ni usar como verbo.
- Secciones y módulos con los nombres de [`_SITEMAP.md`](../_SITEMAP.md) (Investigación, Card Sorting…).
- Planes: Standard, Annual, Education. Programa: Creator codes.

## 11. Logo
- **Símbolo:** cuadrado redondeado (radio 28 %) con **degradado azul eléctrico** (`#5b8cff` → `#2f5fe0`) y una **S** blanca de trazo continuo: el proceso UX conectado de principio a fin.
- **Logotipo:** símbolo + "Soraq" en Inter Semibold, tracking −0.02em.
- Archivos: `public/favicon.svg`, componente `Logo` (SVG decorativo + texto real), `apple-touch-icon.png`, `og-image.png`.
- Funciona igual sobre fondos oscuros y claros (el símbolo mantiene su degradado; el texto usa `foreground`).
- Área de protección: 25 % del alto del símbolo. Tamaño mínimo: símbolo 16 px; logotipo 80 px de ancho.
- **No:** deformar, rotar, recolorear fuera de la paleta, sombras/brillos extra, fondos sin contraste, otra tipografía.

## 12. Iconografía
- Set único **Lucide** (trazo 2 px).
- 16 px inline, 18–20 px navegación y botones, 24 px estados.
- El ícono acompaña una etiqueta; si va solo, tiene nombre accesible y etiqueta visible al hover/foco.
- Mismo concepto = mismo ícono (ej. `House` = resumen del proyecto; `CircleDashed` = sin empezar).

## 13. Color

| Rol | Oscuro (default) | Claro | Uso |
|---|---|---|---|
| Background | `#070709` | `#f9f9fb` | Canvas |
| Surface | `#111114` | `#ffffff` | Sidebars, cards |
| Foreground | `#fafafa` | `#2a2a31` aprox. | Texto principal |
| Muted | `#a8abb3` | `#6b6d74` aprox. | Texto secundario |
| **Accent (azul eléctrico)** | `#376ceb` | `#2c5ad6` aprox. | Acción primaria, foco, activo, brillos |
| Contrast (CTA pill) | Blanco sobre negro | Negro sobre blanco | CTA principal |
| Danger | `#d73337` | similar | Destructivo, errores |

Valores exactos en OKLCH en `theme.css`; contrastes en [GUIDELINES.md §6](GUIDELINES.md#6-color). Oscuro por defecto; claro con el mismo cuidado.

## 14. Tipografía
**Inter Variable** con optical sizing en todo el producto. Display (marketing y páginas de sistema): peso 560, tracking −0.045em. Jerarquía por tamaño y peso, no por color.

## 15. Principios visuales
1. **Oscuridad calma:** canvas casi negro, mucho aire, contraste alto del texto (Framer).
2. **Tipografía protagonista:** titulares grandes de peso medio, tracking ajustado (Antigravity).
3. **Producto como héroe:** ventanas de la interfaz con brillo azul sutil en lugar de ilustraciones genéricas.
4. **Formas suaves:** botones pill, cards de radio amplio, bordes finos.
5. **Acento con moderación:** el azul guía la acción; nunca inunda superficies.
6. **Accesible por defecto:** contraste, foco y tamaños no se negocian.
7. **Sin clichés de IA:** nada de cerebros brillantes ni destellos "mágicos".

## 16. Ejemplos de comunicación

| Situación | Texto |
|---|---|
| Hero | **El espacio de trabajo UX para diseñar con IA.** Soraq conecta todo tu proceso en un único contexto de proyecto, uses la herramienta de IA que uses. |
| Proyectos vacío | **Empieza tu primer proyecto.** Define una vez el problema y las personas para quienes diseñas: cada paso partirá de ahí. |
| Nuevo proyecto | Un proyecto guarda el contexto —problema, usuarios, investigación— sobre el que se construye cada paso de tu proceso. |
| Ítem sin módulo | **Card Sorting llegará pronto.** Este espacio usará el contexto de tu proyecto. |
| Sin conexión | **No podemos conectar con Soraq.** Tu trabajo está a salvo. Revisa tu conexión y vuelve a intentarlo. |
| 404 | **No encontramos esta página.** Es posible que el enlace esté roto o que la página se haya movido. |
| Sesión expirada | Tu sesión expiró. Actualiza la página y vuelve a intentarlo. |
| Precio educativo | Education: US$12/mes — 70 % de descuento sobre el plan Standard para estudiantes verificados. |
| IA (futuro) | Soraq preparó este prompt con el problema y las personas de tu proyecto. Revisa el resultado antes de agregarlo a tu investigación. |
