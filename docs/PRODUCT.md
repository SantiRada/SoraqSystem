# Soraq — Producto

> Documento vivo. Define **qué** es Soraq y **por qué** existe. Las decisiones técnicas están en [ARCHITECTURE.md](ARCHITECTURE.md); las de marca en [BRAND.md](BRAND.md).
> Última revisión: 2026-09-17 · Etapa: **Fundación (v0.2.0)**

---

## 1. Propósito

Soraq es un **UX Operating System**: un espacio de trabajo donde diseñadores UX/UI organizan su proceso completo —investigación, definición, diseño, validación y entrega— **dentro de un único contexto de proyecto**, y trabajan con inteligencia artificial sin perder ese contexto entre herramientas.

Soraq **orquesta** el proceso UX. No intenta reemplazar Figma, Claude, ChatGPT, Gemini ni ninguna herramienta existente.

## 2. Problema

El workflow actual de un diseñador que trabaja con IA está **fragmentado**:

- El contexto del proyecto (problema, usuarios, hipótesis, research) vive disperso en Figma, documentos, chats de IA, `.md`, notas y herramientas de testing.
- Cada herramienta de IA arranca "de cero": el diseñador re-explica el proyecto una y otra vez.
- Prompts, skills, templates, MCP y archivos de contexto se acumulan sin estructura ni criterio de uso.
- Las herramientas de validación (surveys, tree testing, preference tests…) están separadas del resto del proceso, y sus resultados no retroalimentan las decisiones.

**Consecuencia:** pérdida de tiempo, inconsistencia, decisiones sin trazabilidad y un uso superficial de la IA.

## 3. Usuarios

### Principales
UX Designers, UI Designers, Product Designers, UX/UI Designers, freelancers, diseñadores de startups y agencias, **diseñadores que ya trabajan con IA**.

### Secundarios
Estudiantes avanzados de UX/UI, equipos pequeños de producto, agencias, startups, equipos de diseño y, a futuro, empresas más grandes.

### Alcance geográfico
**Global desde el día uno.** El producto es **nativo en español** (neutro) y está preparado para agregar idiomas sin rediseño ([I18N.md](I18N.md)). Ninguna decisión puede asumir un país, moneda, zona horaria o formato local.

## 4. Propuesta de valor

> **Define tu proyecto una vez. Cada paso del proceso —y cada IA que uses— parte de lo que ya sabes.**

| Para el diseñador | Cómo lo resuelve Soraq |
|---|---|
| Re-explicar el proyecto a cada IA | Contexto estructurado y reutilizable por proyecto |
| No saber qué herramienta usar y cuándo | Workflows guiados: qué herramienta, qué enviar, qué esperar, cómo volver |
| Validar en herramientas aisladas | Estudios nativos conectados al contexto del proyecto |
| Prompts sueltos sin criterio | Recursos contextualizados (prompts, skills, `.md`, checklists, criterios) |

## 5. Principio fundamental: contexto conectado

```
PROJECT
 → Problem → Users → Research → Personas → Competitive Analysis → Benchmark
 → Information Architecture → User Flows → Requirements
 → Design → Design System → Prototype
 → Testing → Results → Iteration
 → Handoff → Documentation
```

El contexto definido en un módulo **debe poder ser consumido por otros módulos**. Ejemplo: un módulo de Usability Testing debe poder leer problema, usuarios, funcionalidades, hipótesis y arquitectura ya definidos.

**Regla de producto:** no se construyen herramientas desconectadas. Todo módulo nuevo declara qué contexto **consume** y qué contexto **produce** (ver plantilla en [modules/_TEMPLATE.md](modules/_TEMPLATE.md)).

## 6. Tipos de funcionalidades

| Tipo | Qué es | Ejemplos | Qué incluye |
|---|---|---|---|
| **NATIVE** | Se ejecuta dentro de Soraq | Surveys, Usability Tests, 5 Second Test, Preference Test, A/B Test, Card Sorting, Tree Testing, First Click Test | Configuración, participantes, ejecución, resultados, análisis, exportación |
| **INTEGRATION** | Usa una herramienta externa | Figma, Claude, ChatGPT, Gemini, Perplexity, herramientas de research/desarrollo | Qué herramienta, cuándo, cómo, qué enviar, qué prompt/archivos, qué esperar, cómo devolver el resultado a Soraq |
| **AI WORKFLOW / RESOURCE** | Recursos para trabajar con IA | Prompts, `.md`, skills, templates, instrucciones, artefactos, frameworks, checklists, criterios de evaluación | Siempre **contextualizados por proyecto** y parte de un workflow completo |

Soraq **no se posiciona como biblioteca de prompts**.

## 7. Áreas conceptuales

Actualizado el 2026-09-17 según [`/_SITEMAP.md`](../_SITEMAP.md), que define la navegación **dentro de un proyecto**. Reglas de interfaz en [NAVIGATION.md](NAVIGATION.md); la estructura vive como datos en `frontend/src/features/workspace/config/projectNavigation.ts`.

| Área (nivel 1) | Sección (nivel 2) | Lo que se puede crear (niveles 3–4) |
|---|---|---|
| **Planear** | Investigación | Desktop Research, Benchmarking, Encuestas, Entrevistas |
| | Síntesis | Mapa de Afinidad, Mapa de Empatía, Journey Map |
| | Navegación | Arquitectura (Card Sorting, Tree Testing, Mapa de Sitio) · Flujos (Task Flow, User Flow, Wire Flow, Flow Chart) |
| **Diseño** | Brief | — |
| | Marca | Brandbook |
| | Estética Visual | Moodboard, UI Kit |
| | Design System | Foundations, Components, Variables |
| **Testeos** | Prototipo | Five Second Test, First Click Test, A/B Test, Usability Test |
| | Tracking | Eye, Scroll, Mouse, Click |
| **Entregables** | Handoff | — |
| | Documentación | MD Files, Context Prompt, Recursos |

El **AI Workspace** conceptual (prompts, skills, `.md`, MCP, workflows externos) se materializa hoy en **Entregables → Documentación** y, de forma transversal, en los workflows de cada módulo.

> Mapa anterior (Discover / Define / Design / Validate / Deliver / AI Workspace) reemplazado por esta estructura.

## 8. Modelo de negocio (SaaS)

### Planes y precios de referencia

| Plan | Precio | Notas |
|---|---|---|
| **Standard** | **US$40 / mes** | Precio de referencia del producto |
| **Annual** | **US$360 / año** | = US$30/mes efectivo. Incentivo de permanencia |
| **Creator code** | US$30 / mes para el usuario | Creador recibe ~US$5/usuario referido (recurrente). Soraq ~US$25 antes de costos |
| **Education** | US$12 / mes | Principalmente estudiantes. Conceptualmente: US$40 → 70% descuento |

**Regla de comunicación de precio:** el precio de referencia es **US$40**. Los precios Creator y Education son **descuentos sobre la referencia**, nunca "el precio real". No deben alterar la percepción de valor del producto.

### Creator codes (futuro — arquitectura preparada, no implementado)
- Códigos de referido / creador, atribución, comisiones recurrentes, dashboard del creador.

### Education (futuro — arquitectura preparada, no implementado)
- Códigos educativos, verificación de estudiante, códigos institucionales, expiración, límites de uso, conversión de Education → plan profesional.

El diseño de datos previsto está en [DATABASE.md → Entidades futuras](DATABASE.md#4-entidades-futuras-no-implementadas).

## 9. Principios de pricing

1. **No bloquear artificialmente funcionalidades.** Todos los usuarios acceden al producto y sus capacidades principales.
2. **Limitar por consumo real**, no por "features escondidas": uso, volumen, participantes, créditos de IA, almacenamiento, recursos computacionales.
3. La arquitectura debe poder evolucionar hacia: usage limits, AI credits, participant limits, storage, advanced features, team features — **sin rediseño profundo** (ver [ARCHITECTURE.md → Entitlements](ARCHITECTURE.md#12-preparación-para-billing-entitlements-y-límites)).
4. Los precios se almacenan en **unidades menores enteras + código ISO 4217**; nunca como float ni asumiendo USD en el código.

## 10. Principios de producto

1. **Contexto conectado > herramientas aisladas.**
2. **Orquestar > reemplazar.** Integrar lo que el diseñador ya usa.
3. **Workflows completos > recursos sueltos.**
4. **Usabilidad y accesibilidad > decoración.** (WCAG 2.2 AA como mínimo.)
5. **Claridad sobre la IA:** decir qué hace la IA, qué no, y qué debe revisar el humano. Sin hype.
6. **Honestidad de disponibilidad:** nunca presentar como disponible algo que no lo está.
7. **Global por defecto.**
8. **Privacidad y seguridad por diseño:** los datos de un usuario solo existen en su contexto.

## 11. Roadmap conceptual

> Orden orientativo; cada etapa se planifica y documenta antes de implementarse.

| Etapa | Contenido | Estado |
|---|---|---|
| **0 — Fundación** | Arquitectura, design system base, auth, autorización por ownership, proyectos (módulo de referencia), seguridad, documentación | ✅ Esta versión |
| **1 — Contexto de proyecto** | Problem, Users, hipótesis, funcionalidades: el "núcleo de contexto" reutilizable | Próxima |
| **2 — Discover / Define** | Research, Personas, Benchmark, IA, User Flows, Requirements | Planificada |
| **3 — Validate (nativo)** | Surveys, Preference Test, 5 Second Test, Card Sorting, Tree Testing, First Click… (uno por vez) | Planificada |
| **4 — AI Workspace** | Recursos, workflows guiados, integraciones externas | Planificada |
| **5 — Billing** | Planes, Stripe u otro proveedor, entitlements, límites de uso | Planificada |
| **6 — Creator & Education** | Códigos, atribución, comisiones, verificación | Planificada |
| **7 — Equipos** | Workspaces, organizaciones, roles, permisos | Planificada |

## 12. Fuera de alcance en la etapa actual

Estudios completos, billing real, Stripe, dashboards de creator/education, integraciones de IA (Claude/ChatGPT/Gemini), integración con Figma, reclutamiento de participantes, analytics complejos, funcionalidades enterprise.

## 13. Estado actual del producto (v0.2.0)

- **Idioma:** producto nativo en español (neutro, tuteo), preparado para otros idiomas ([I18N.md](I18N.md)).
- **Estética:** HeroUI en modo oscuro (modo claro disponible), referencias Framer y Google Antigravity.
- Registro, inicio y cierre de sesión. Rol de plataforma `user` / `admin` (admin no ve proyectos ajenos).
- **Proyectos:** listar y crear, sin sidebar; controles de cuenta flotantes. Proyectos **compartidos** con roles owner / editor / viewer.
- **Configuración del proyecto** (menú de cuenta, dentro de un proyecto): General (nombre, descripción), Acceso (personas con acceso), Eliminar proyecto.
- **Producto** (Investigación): notas de producto en tablero masonry. **Context Prompt** (Documentación): esas notas resumidas por tema con IA (Groq) para copiar a otra IA o agente.
- **Perfil** (menú del usuario): datos, cambio de nombre/correo y contraseña, pagos (plan activo, próximo pago, historial, cambiar plan — checkout aún no disponible), cerrar sesión, eliminar cuenta, idioma y modo.
- **Workspace de proyecto:** resumen, 11 secciones y 31 ítems según `_SITEMAP.md`, con un sidebar que el usuario contrae o expande y una barra para moverse entre ítems de la misma sección. Los ítems muestran un espacio "llegará pronto" hasta que exista su módulo.
- Home pública (hero, marquee de herramientas, paneles de producto, áreas del proceso), 404, página de error.
- La home usa el badge **"Acceso anticipado"** y describe capacidades futuras (estudios nativos, workflows con IA): **antes de producción, ajustar el copy a lo disponible** (principio 6).
