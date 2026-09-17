# Changelog

Todos los cambios relevantes de Soraq se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).
Secciones: **Added · Changed · Fixed · Security · Removed · Docs**. Decisiones de arquitectura: [docs/decisions/](docs/decisions/).

## [Unreleased]

### Added
- **Card Sorting** (Navegación → Arquitectura): estudios abiertos, híbridos y cerrados. Configuración en pasos (nombre y propósito, participantes, cards con descripción opcional, tipo y categorías, Flow con bienvenida, contexto, preguntas de validación, instrucciones, preguntas post-estudio, gracias y estudio cerrado); estados en edición → publicado ⇄ pausado → cerrado; enlace público `/cardsorting/{proyecto}/{código}`; compartir en modo lectura; eliminar resultados o el estudio. Reporte con preguntas (mayoría), participantes, matriz de similitud, dendrograma y clusters con nombres normalizados. Configuración de botones, color de acento y redes sociales. ADR 0015.
- Editor de texto enriquecido para descripciones (Tiptap: títulos, grosor, fuente, tamaño, cursiva, listas, separador, Ctrl+B / Ctrl+I) guardado como JSON validado.
- Módulo backend **CardSorting** (16 endpoints, 4 públicos), migración `000010`, rate limits, mensajes; seeder local `bin/seed-card-sort-demo.php`.
- Design system: `SwitchField`, `RadioGroupField`, `CheckboxGroupField`, `CheckboxField`, `ColorPickerField`.
- Smoke test: 125 verificaciones (card sorting: roles, IDOR, lector compartido, publicación, participante, validaciones).
- **Investigación → Producto**: notas ilimitadas (título + contenido, máx. 200 por proyecto) en tablero masonry, con temas sugeridos (Problemática, Objetivos, Soluciones, POV, MVP, Contexto), edición y eliminación (owner/editor; viewer solo lectura).
- **Documentación → Context Prompt**: las notas resumidas y unificadas por tema con IA, listo para copiar y pegar en otra IA o agente. Se regenera al abrir cuando las notas cambiaron; sin clave de IA muestra las notas completas.
- Integración con **Groq** detrás de una interfaz `AiClient` (`backend/src/Modules/Ai`, `config/ai.php`, variables `GROQ_API_KEY`, `GROQ_MODEL`, `AI_*`); ADR 0013.
- Módulo backend **ProductContext** (6 endpoints), migración `000009` (`product_notes`, `project_context_prompts`), rate limits y mensajes nuevos.
- Smoke test: 80 verificaciones (notas, Context Prompt, roles e IDOR).
- Design system: `Toast` (confirmación breve flotante, anunciada a lectores de pantalla, con transición y `prefers-reduced-motion`).
- Skill de proyecto **`/auditoria`** (`.claude/skills/auditoria/`): auditoría completa manual (alcance desde la última auditoría, ~30 chequeos automáticos, checklist de ~90 puntos, matriz de acceso, recorrido en navegador, informe en `docs/audits/`). Scripts: `scope.sh`, `automated-checks.sh`, `i18n-audit.mjs`, `contrast.mjs`.

### Changed (experiencia)
- Notificaciones (Toast, ahora con tonos éxito/error/aviso/info) y barra de cambios sin guardar siempre fijas al viewport (portal + z-index alto); la animación de entrada ya no deja un contenedor que atrape elementos fijos.
- **Card Sorting · participante**: lista de tarjetas acoplada al borde izquierdo; instrucciones dentro del canvas con la lista visible; barra de progreso y Continuar/Finalizar fija arriba a la derecha; soltar una tarjeta en el canvas crea un grupo; grupos con menos redondeo, sin contador y renombrado en línea ("Clic para renombrar" subrayado punteado); los grupos creados vacíos desaparecen; hover del botón principal aclara u oscurece el color de acento elegido; "Hecho con Soraq" enlaza al inicio. "Abrir enlace" abre en pestaña nueva. Pasos de instrucciones colapsables. Nombres usados del dendrograma sin variantes.
- **Movimiento**: páginas, tarjetas, alertas, estados vacíos/carga y pestañas aparecen con fundido y leve desplazamiento; secciones colapsables y contenido que se muestra/oculta animan altura en ambos sentidos (`Reveal`). Respeta `prefers-reduced-motion`.
- Workspace: el contenido usa el ancho disponible (sin centrado con espacio vacío a la izquierda); la barra de ítems de nivel 3 ya no es fija.
- **Card Sorting**: terminología Tarjetas / Flujo; paso 1 incluye participantes; tarjetas y categorías se reordenan arrastrando desde un asa (o con flechas), sin etiqueta por ítem, sin límite visible y se eliminan si quedan vacías; orden aleatorio para tarjetas y categorías; descripciones de tarjetas se editan al activarlas (sin demora al activar el switch); Flujo con secciones y preguntas colapsables, expandir/colapsar todo, editores más altos, encabezado único "Opciones"/"Resultado", accesos a Tarjetas y Categorías, texto de ayuda para respuestas de texto y botón Publicar al final; instrucciones por defecto con formato; editor sin control de tamaño; salir sin guardar ofrece "Guardar y salir"; Reporte: "Preguntas con respuesta", filas de participantes abren sus respuestas, matriz de similitud triangular con resaltado en gris y detalle flotante siempre visible, dendrograma con resaltado en gris, clusters sin variantes; color de acento por defecto azul Soraq; corrección visual del selector de tono y alineación de botones.

### Changed (navegación)
- **Perfil** pasa de modal a página (`/app/account/{profile|billing|session|preferences}`), con barra de links como Configuración del proyecto y "Volver" al lugar de origen.
- **Diálogos**: Escape y clic afuera cierran; si hay texto sin guardar piden confirmación antes de descartarlo (`Dialog hasUnsavedChanges`). **Cerrar sesión** pide confirmación en todos los accesos.
- **Atajos**: Ctrl+{n} (alias Alt+{n}) va a la sección de nivel 2; Shift+{n} al ítem de nivel 3 de la sección abierta. Pistas en el sidebar y `aria-keyshortcuts`.
- Se elimina el **sidebar secundario**: los ítems de nivel 3 se abren desde la página de su sección.
- El sidebar del proyecto se **contrae o expande a elección del usuario** con un botón junto al logo (preferencia guardada por dispositivo).
- Nueva **barra de ítems** (ItemSwitcher) flotante arriba a la izquierda en páginas de nivel 3 para ir a otro ítem de la misma sección. ADR 0014 (reemplaza parcialmente 0010).

### Fixed
- Context Prompt: el contenido ya no desborda el ancho de la pantalla (scroll horizontal); "Prompt copiado" usa `Toast`.
- Producto: masonry de 3 columnas en desktop (2 en tablet, 1 en mobile), altura según el texto.

### Changed
- **Configuración del proyecto** sale del sidebar: ahora es una opción del menú de cuenta (solo dentro de un proyecto), con barra de links General · Acceso · Eliminar proyecto. Se elimina el grupo "Proyecto" de la navegación.
- Los ítems con módulo disponible muestran su ícono en lugar de "Sin empezar".
- `i18n-audit.mjs` toma los namespaces del catálogo (antes estaban fijos).
- Proceso: ya no se audita cada función al crearla; solo verificación mínima (typecheck, lint, build, smoke). La auditoría completa se lanza manualmente con `/auditoria` tras varios cambios y antes de cada deploy (`WORKFLOW.md §4 y §7`, `SECURITY_AUDIT.md §2–3`, `CLAUDE.md`).
- Eliminadas 3 claves i18n sin uso detectadas por el nuevo script.

## [0.3.0] — 2026-09-17 — Configuración del proyecto y Perfil

### Added
- **Configuración** del proyecto (grupo "Proyecto", debajo de Documentación): **General** (nombre y descripción), **Acceso** (personas con acceso: dar acceso por email a cuentas existentes, cambiar rol, quitar acceso, salir del proyecto) y **Eliminar proyecto** (confirmando el nombre).
- **Proyectos compartidos** con roles owner / editor / viewer (tabla `project_members`, `accessRole` en el API, `ProjectPolicy` ampliada; ADR 0011).
- **Perfil** en el menú del usuario (esquina flotante, sidebar y rail): diálogo con pestañas **Perfil** (resumen, cambiar nombre y correo, cambiar contraseña), **Pagos** (plan activo, próximo pago, cambiar plan, historial), **Sesión y cuenta** (cerrar sesión, eliminar cuenta) y **Preferencias** (idioma, modo claro/oscuro).
- Módulos backend **Account** (`PATCH /account`, `POST /account/password`, `PATCH /account/preferences`, `DELETE /account`) y **Billing** de solo lectura (`GET /billing/overview`); ADR 0012.
- Migraciones `000006` (auth_version), `000007` (project_members), `000008` (plans, subscriptions, payments + planes de referencia).
- Datos de facturación de ejemplo para la cuenta debug local.
- Design system: `SelectField`, tamaño `lg` en `Dialog` y cuerpo opcional; re-exports `Tabs`, `ToggleButton`, `ToggleButtonGroup`.
- Validación `in:`; mensajes nuevos en `lang/es`.
- Smoke test ampliado a 62 verificaciones (roles, IDOR en nuevas rutas, cuenta) con limpieza automática de usuarios de prueba.

### Changed
- El scope de proyectos incluye membresías; el listado muestra "Compartido · {rol}".
- Cambiar la contraseña cierra las demás sesiones (`users.auth_version`).
- `AccountMenu` pasa del feature auth al nuevo feature `account`.

### Fixed
- En rutas estáticas del workspace (Configuración) no se mostraban el rail ni el sidebar secundario.

### Security
- Re-autenticación para cambiar correo, contraseña y eliminar la cuenta; rate limits nuevos; auditoría de todos los cambios. Auditoría [2026-09-17 — compartir, cuenta y facturación](docs/audits/2026-09-17-sharing-account-billing.md): sin hallazgos críticos; verificación de email se suma a los bloqueantes de lanzamiento.

## [0.2.0] — 2026-09-17 — HeroUI, español nativo y workspace de proyecto

### Added
- **Workspace de proyecto** (`features/workspace`) según `/_SITEMAP.md`: resumen, 4 grupos, 11 secciones y 31 ítems; sidebar principal expandido / rail de íconos (`RailLink` con etiqueta accesible en hover y foco) y sidebar secundario con lo que se puede crear; drawer en mobile; `useWorkspace()` para módulos.
- **i18n**: catálogos tipados `src/i18n/locales/es/*` (`useI18n`, plurales, interpolación) y `Core/I18n/Translator` + `backend/lang/es` con negociación por `Accept-Language` y `Content-Language`.
- **Tema claro** además del oscuro por defecto: `ThemeProvider`, `ThemeToggle`, `theme-init.js`.
- **Rol de plataforma** `users.role` (`user`/`admin`), `User::isAdmin()`, middleware `RequireAdmin`.
- Cuenta de debug local `debug@debug.com` / `debug1234` (admin) con `bin/seed-debug-user.php` (solo development). El usuario local anterior se convirtió en esta cuenta.
- Migraciones `000004_add_role_to_users`, `000005_default_locale_es`.
- Home nueva: hero centrado con campo de puntos y brillo, vista previa del producto, marquee de herramientas pausable, paneles de producto, áreas del proceso, CTA final.
- `AuthLayout` en dos columnas con panel de marca; `AccountMenu`, `SignOutButton`, `ButtonAnchor`.
- Docs: `I18N.md`, `NAVIGATION.md`, `modules/workspace.md`, ADRs 0007–0010, auditoría 2026-09-17.

### Changed
- **Design system sobre HeroUI v3 + Tailwind CSS v4** (reemplaza CSS Modules y tokens propios; ADR 0007). Estética oscura con referencias Framer / Google Antigravity; acento azul eléctrico; botones pill; Inter con optical sizing.
- **Toda la interfaz y los mensajes del API en español** (neutro, tuteo); `index.html`, manifest y Open Graph en español (ADR 0008).
- **Sin sidebar fuera de un proyecto**: `AppLayout` con logo flotante arriba a la izquierda y usuario, cambio de modo y "Cerrar sesión" arriba a la derecha (ADR 0010).
- API de componentes: `onPress`, `isLoading`, `onChange(value)`; `Dialog` con `isOpen`.
- `HttpException` y `Validator` usan claves de traducción; `ErrorHandler` traduce.
- Logo y favicon en azul; imagen Open Graph regenerada en español.
- ESLint: prohíbe importar HeroUI/React Aria fuera de `design-system` y catálogos fuera de `i18n`.

### Removed
- `config/navigation.ts` (áreas Discover/Define/…), página de detalle de proyecto en `features/projects` (ahora resumen del workspace), CSS Modules y tokens anteriores.

### Security
- Auditoría [2026-09-17](docs/audits/2026-09-17-heroui-i18n-roles-workspace.md): sin hallazgos críticos en código; control de proceso bloqueante para que la cuenta debug nunca llegue a staging/producción.

## [0.1.0] — 2026-09-16 — Fundación

Primera base del nuevo Soraq (solo localhost; la versión publicada en soraq.app no se modificó).

### Added
- **Frontend** React 19 + TypeScript strict + Vite 8, React Router 8 (rutas lazy por feature), ESLint con `jsx-a11y` strict y reglas de fronteras entre features.
- **Design system** propio: tokens en 3 capas (primitivos, semánticos dark/light, foundation), estilos base accesibles (foco visible, reduced motion, forced colors, target size táctil) y componentes `Button`, `ButtonLink`, `IconButton`, `Field`, `TextField`, `TextAreaField`, `PasswordField`, `Alert`, `Badge`, `Card`, `Dialog`, `EmptyState`, `LoadingState`, `Spinner`, `PageHeader`, `Logo`, `SkipLink`.
- **Layouts** públicos, de autenticación y de aplicación (sidebar desktop / drawer mobile), tema oscuro por defecto y claro.
- **Páginas**: home, registro, login, proyectos, detalle de proyecto, 404 (pública y dentro de la app), error de ruta.
- **Infra frontend**: cliente HTTP único con CSRF, `ApiError` normalizado, `useApiQuery`, formateo i18n con Intl, `usePageMeta`, foco automático en cambios de ruta.
- **SEO**: metadatos base, Open Graph, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `og-image.png`, favicon SVG, apple-touch-icon.
- **Backend** PHP 8.2 sin framework: front controller, router con middleware, config por entorno (`.env`), PDO, errores seguros, validación, logger con redacción, ULIDs.
- **Módulos backend**: Health, Auth (register/login/logout/session), Users, Projects (listar/crear/ver — módulo de referencia).
- **Base de datos**: migraciones `users`, `projects`, `audit_logs`, `rate_limits` + runner `bin/migrate.php`.
- **Smoke test** de API y control de acceso (`backend/tests/smoke/api-smoke.sh`, 27 verificaciones).
- `.gitignore`, `.env.example` (backend y frontend), `.htaccess` de producción para frontend y API.

### Security
- Contraseñas Argon2id; sesiones `HttpOnly`/`SameSite=Lax`/`__Host-` + `Secure` en HTTPS, strict mode, timeouts, regeneración de ID.
- CSRF synchronizer token global + verificación de `Origin`.
- Rate limiting de login, registro y creación de proyectos.
- Acceso por ownership con scope en SQL + policies; 404 uniforme para recursos ajenos (anti-IDOR).
- Headers de seguridad en API y CSP estricta para producción.
- Audit log de eventos de autenticación y creación de proyectos.
- Aislamiento local: `.htaccess` raíz deniega todo salvo `backend/public`.
- Auditoría inicial: [docs/audits/2026-09-16-foundation.md](docs/audits/2026-09-16-foundation.md) — sin hallazgos críticos/altos.

### Docs
- `PRODUCT`, `GUIDELINES`, `ARCHITECTURE`, `BRAND`, `SECURITY_AUDIT`, `DATABASE`, `DEPLOYMENT`, `WORKFLOW`, `TESTING`, `SEO`.
- ADRs 0001–0006, plantillas de ADR, módulo y auditoría; fichas de módulos Auth y Projects.
