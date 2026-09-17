# Soraq — Arquitectura

> Cómo está construido Soraq y **por qué**. Antes de modificar código, leé la sección del área que vas a tocar.
> Cambios de decisiones importantes → nuevo ADR en [decisions/](decisions/) y actualización de este documento.
> Última revisión: 2026-09-17 · v0.3.0

**Índice**
1. [Principios](#1-principios) · 2. [Stack y decisiones](#2-stack-y-decisiones) · 3. [Estructura de carpetas](#3-estructura-de-carpetas) · 4. [Frontend](#4-frontend) · 5. [Backend](#5-backend) · 6. [API](#6-api) · 7. [Autenticación](#7-autenticación) · 8. [Autorización](#8-autorización) · 9. [Base de datos](#9-base-de-datos) · 10. [i18n](#10-internacionalización-i18n) · 11. [Variables de entorno](#11-variables-de-entorno) · 12. [Billing y límites](#12-preparación-para-billing-entitlements-y-límites) · 13. [Convenciones de nombres](#13-convenciones-de-nombres) · 14. [Localhost](#14-flujo-localhost) · 15. [Producción](#15-producción) · 16. [Cómo agregar un módulo](#16-cómo-agregar-un-módulo-ejemplo-card-sorting)

---

## 1. Principios

| Prioridad | Sobre |
|---|---|
| Mantenibilidad | Escalabilidad innecesaria |
| Seguridad | Velocidad de implementación |
| Cambios localizados | Refactors "porque queda más limpio" |
| Documentación | Conocimiento implícito |

- **Módulos con responsabilidades acotadas.** Cambiar Tree Testing no toca auth, billing, design system, otros módulos ni configuración global.
- **La lógica de negocio no vive en la UI** ni en controladores HTTP.
- **La seguridad se decide en el backend.** El frontend solo mejora la experiencia.
- **Cada dependencia tiene una razón escrita** (§2).
- **Simple + profesional + escalable.**

## 2. Stack y decisiones

| Capa | Tecnología | Versión (2026-09) |
|---|---|---|
| Frontend | React + TypeScript (strict) | React 19, TS 6 |
| Build / dev server | Vite | 8 |
| Routing | React Router (data router) | 8 |
| UI / componentes | **HeroUI v3** (React Aria) | 3.2 |
| Estilos | **Tailwind CSS v4** + variables semánticas de HeroUI | 4.3 |
| Iconos | lucide-react | 1.x |
| Tipografía | Inter Variable con optical sizing (self-hosted, @fontsource) | 5.x |
| i18n | Catálogos tipados propios (frontend) + `Translator` (backend) | — |
| Lint | ESLint 9 + typescript-eslint + react-hooks + **jsx-a11y (strict)** | — |
| Backend | PHP sin framework, `strict_types` | 8.2+ |
| Base de datos | MySQL 8 / MariaDB 10.4+ (InnoDB, utf8mb4) | — |
| Hosting | Hostinger (Apache + PHP + MySQL), soraq.app | — |

| Decisión | Por qué | ADR |
|---|---|---|
| SPA con Vite, API PHP mismo origen (`/api`) | Hostinger sin Node persistente; sin CORS; cookies SameSite efectivas | [0001](decisions/0001-spa-vite-with-php-api-same-origin.md) |
| PHP sin framework, monolito modular | Deploy trivial, superficie mínima, código auditable | [0002](decisions/0002-php-without-framework-modular-monolith.md) |
| HeroUI v3 + Tailwind v4 | Estética definida por producto; componentes accesibles (React Aria); temas por variables | [0007](decisions/0007-heroui-tailwind-design-system.md) (reemplaza 0003) |
| Sesiones PHP + CSRF token | Sin tokens accesibles a JS; revocación inmediata | [0004](decisions/0004-session-cookies-csrf-auth.md) |
| Ownership con scope en SQL + ULID | Anti-IDOR en dos capas; migrable a workspaces | [0005](decisions/0005-ownership-scoped-access-and-public-ids.md) |
| Producto nativo en español + i18n tipado | Pedido de producto; cambio de idioma sin tocar componentes | [0008](decisions/0008-spanish-native-i18n.md) (reemplaza 0006) |
| Rol de plataforma `user`/`admin` + cuenta debug local | Acceso admin sin romper ownership | [0009](decisions/0009-platform-roles-and-debug-account.md) |
| Workspace de proyecto: un sidebar colapsable + barra de ítems | Navegación definida en `_SITEMAP.md` | [0010](decisions/0010-project-workspace-navigation.md) → [0014](decisions/0014-single-collapsible-sidebar-item-switcher.md) |
| Proyectos compartidos (owner/editor/viewer) | Configuración → Acceso | [0011](decisions/0011-project-sharing-roles.md) |
| Autogestión de cuenta + facturación de solo lectura | Perfil (datos, contraseña, pagos, eliminación) sin proveedor de pagos todavía | [0012](decisions/0012-account-self-service-and-billing-read-model.md) |
| IA vía backend detrás de `AiClient` (Groq primero) | Context Prompt resumido; proveedores intercambiables; clave nunca en el cliente | [0013](decisions/0013-ai-provider-groq-context-prompt.md) |
| Estudios (Card Sorting): documento JSON validado + snapshot por respuesta + análisis en el cliente | Contenido anidado editable sin romper resultados; patrón para Tree Testing | [0015](decisions/0015-card-sorting-studies.md) |

**Dependencias frontend y su razón:** `react`, `react-dom`, `react-router` (base/routing) · `@heroui/react`, `@heroui/styles`, `react-aria`, `react-aria-components`, `@react-aria/*` (componentes accesibles; peer deps de HeroUI) · `tailwindcss`, `@tailwindcss/vite` (requeridos por HeroUI) · `lucide-react` (iconografía) · `@tiptap/react`, `@tiptap/pm`, `@tiptap/core`, `@tiptap/starter-kit` (editor de descripciones de estudios; MIT; carga diferida) · `simple-icons` (íconos de redes sociales; CC0) · `@fontsource-variable/inter` (fuente sin terceros). Backend: **sin dependencias de terceros**.

## 3. Estructura de carpetas

```
SoraqSystem/
├── _SITEMAP.md               Arquitectura de navegación dentro de un proyecto (producto)
├── .htaccess                 Solo local: deniega todo lo servido por XAMPP excepto backend/public
├── CHANGELOG.md · CLAUDE.md · README.md · .gitignore
├── docs/                     PRODUCT · GUIDELINES · ARCHITECTURE · BRAND · SECURITY_AUDIT · DATABASE
│                             DEPLOYMENT · WORKFLOW · TESTING · SEO · I18N · NAVIGATION
│                             decisions/ (ADRs) · modules/ (fichas) · audits/ (auditorías)
│
├── frontend/
│   ├── index.html            Meta base (es), SEO, Open Graph, theme-init
│   ├── public/               .htaccess (prod), robots, sitemap, manifest, favicon, OG, theme-init.js
│   └── src/
│       ├── main.tsx          Fuente, estilos globales, <App/>
│       ├── app/              COMPOSICIÓN
│       │   ├── App.tsx       I18nProvider → ThemeProvider → AuthProvider → Router
│       │   ├── router.tsx    Mapa de rutas (dónde monta cada feature)
│       │   └── layouts/      RootLayout · PublicLayout · AuthLayout · AppLayout (sin proyecto)
│       ├── config/           env.ts · paths.ts
│       ├── i18n/             config · types · translate · I18nProvider · locales/es/*
│       ├── design-system/    Fachada sobre HeroUI
│       │   ├── styles/       index.css (@heroui/styles + theme + base) · theme.css (tokens marca, dark/light) · base.css
│       │   ├── components/   Button · Fields · Dialog · Alert · Badge · EmptyState · IconButton · LoadingState · Logo · PageHeader · SkipLink
│       │   └── index.ts      API pública (wrappers + re-exports de HeroUI)
│       ├── shared/           api/ · a11y/ · forms/ · i18n/format.ts · lib/cn.ts · seo/ · theme/
│       └── features/
│           ├── auth/         api · components (formularios, UserAvatar, SignOutButton) · context · guards · model · pages
│           ├── account/      AccountMenu · pages (Perfil: Datos personales, Pagos, Sesión y cuenta, Preferencias) · api · routes
│           ├── projects/     api · components · model · pages (listado) — módulo de referencia de acceso
│           ├── workspace/    config/projectNavigation · context · components (PrimaryNav, RailLink, ItemSwitcher) · hooks · layout · pages
│           ├── marketing/    Home pública (components, data, pages)
│           └── system/       404 y error de ruta
│
└── backend/
    ├── .env.example
    ├── public/               index.php + .htaccess (ÚNICA carpeta expuesta)
    ├── bootstrap/app.php
    ├── config/               app (locale) · database · session · rate_limits · modules
    ├── lang/es/              errors.php · validation.php
    ├── src/
    │   ├── Core/             Application · Services · Config · Http · Database · Security · Audit · Errors · I18n · Logging · Validation · Support
    │   └── Modules/          Health · Users · Auth (RequireAuth, RequireAdmin) · Projects (members) · Account · Billing
    ├── database/migrations/  000001–000008
    ├── bin/                  migrate.php · seed-debug-user.php (solo development)
    ├── storage/              logs · sessions · uploads (fuera de git)
    └── tests/smoke/          api-smoke.sh
```

### Reglas de dependencia (frontend)

```
app ──► features ──► shared · design-system · i18n · config
                 └─► otro feature SOLO vía su index.ts
design-system ──► HeroUI · i18n · shared/lib
shared/theme  ──► design-system (ThemeToggle)
```
ESLint bloquea: `@/features/<x>/<interno>`, `@heroui/*` y `react-aria-components` fuera de `design-system` (y `RootLayout` para el router bridge), `@/i18n/locales/*` fuera de `i18n`, `dangerouslySetInnerHTML`.

## 4. Frontend

### 4.1 Anatomía de un feature
```
features/<feature>/
├── api/<feature>Api.ts     Llamadas tipadas a httpClient
├── model/types.ts          Contrato del API + constantes de validación compartidas
├── components/             UI específica (Tailwind + @/design-system)
├── pages/                  Una por ruta; usePageMeta; contiene el <h1>
├── routes.tsx              RouteObject[] con páginas lazy
└── index.ts                API pública
```
Textos: `src/i18n/locales/es/<feature>.ts`.

### 4.2 Routing

| Ruta | Layout | Guard |
|---|---|---|
| `/` | PublicLayout | — |
| `/login`, `/register` | AuthLayout | RedirectIfAuthenticated |
| `/app/projects` | **AppLayout** (sin sidebar, controles flotantes) | RequireAuth |
| `/app/projects/:projectId[/:sectionId[/:itemId]]` | **ProjectWorkspaceLayout** (feature workspace, dos sidebars) | RequireAuth |
| `*` | 404 pública o dentro de AppLayout | — |

- URLs centralizadas en `config/paths.ts`. Navegación del proyecto como datos en `features/workspace/config/projectNavigation.ts` ([NAVIGATION.md](NAVIGATION.md)).
- Guards = UX. Redirección post-login solo a `/app…` (`isSafeRedirect`).
- `RootLayout`: `RouterProvider` de React Aria (links de HeroUI navegan en cliente), `useRouteFocus` (foco al `<h1 data-page-heading>`), `ScrollRestoration`, barra de progreso.

### 4.3 Estado
| Tipo | Solución |
|---|---|
| Sesión | `AuthProvider` |
| Idioma | `I18nProvider` |
| Tema claro/oscuro | `ThemeProvider` (+ `public/theme-init.js` antes del render) |
| Proyecto abierto | `WorkspaceContext` / `useWorkspace()` |
| Datos del servidor | `useApiQuery` + `features/*/api` |
| Formularios / UI | `useState` local |

### 4.4 Capa API
`shared/api/httpClient.ts` es el único `fetch`: mismo origen, cookie de sesión, `X-CSRF-Token`, `Accept-Language`, reintento único si el CSRF expiró, `{data}` → datos, `{error}` → `ApiError` (`kind`). Mensajes del servidor ya localizados; errores de red se traducen en cliente (`toUserMessage(error, t)`).

### 4.5 Estilos y design system
- `styles/index.css` importa `@heroui/styles` (Tailwind + componentes), `theme.css` (marca) y `base.css`.
- **Tokens = variables semánticas de HeroUI** (`bg-background`, `bg-surface`, `text-muted`, `bg-accent`, `border-border`…). Prohibido hex/colores crudos en componentes (salvo decoración de marca documentada, p. ej. monogramas de herramientas).
- Temas: `[data-theme='dark']` (default) y `[data-theme='light']`; `html` también lleva clase `.dark`/`.light` (HeroUI).
- Utilidades de marca en `base.css`: `.text-display`, `.bg-dot-field`, `.border-glow`, `.marquee*`.
- Reglas de UI: [GUIDELINES.md](GUIDELINES.md).

### 4.6 SEO
`usePageMeta` + `index.html` + `robots.txt` + `sitemap.xml` ([SEO.md](SEO.md)).

## 5. Backend

### 5.1 Ciclo de una request
```
Apache ─► public/index.php ─► bootstrap/app.php (autoload + Config)
        ─► Application::run()
             ├─ Translator::negotiate(Accept-Language) → Services(locale)
             ├─ Request::fromGlobals()
             ├─ Router (global: VerifyOrigin → VerifyCsrf)
             ├─ config/modules.php → Modules/<X>/routes.php
             ├─ middleware de ruta (RequireAuth, RequireAdmin)
             ├─ Controller → Service → Policy / Repository → Database
             └─ Response::json()  |  ErrorHandler (Throwable → JSON localizado y seguro)
        ─► Response::send() (+ Content-Language, headers de seguridad)
```

### 5.2 Core vs Modules
- `Core/` nunca importa `Modules/`.
- Módulos de plataforma de los que otros dependen: **Auth** (`AuthModule::requireAuth/requireAdmin`, `CurrentUser`) y **Users**.

### 5.3 Capas dentro de un módulo
| Capa | Responsabilidad | Prohibido |
|---|---|---|
| `routes.php` | Endpoints, middleware, cableado | Lógica |
| Controller | HTTP → service → `Response` | Reglas, SQL |
| Service | Validación, reglas, policy, auditoría, rate limit | SQL, formato HTTP |
| Policy | ¿Puede el usuario hacer X sobre el recurso? | DB, efectos |
| Repository | SQL parametrizado **con scope** | Reglas |
| Entidad | Datos + `toPublicArray()` | Exponer internos |

### 5.4 Middleware
| Middleware | Alcance | Función |
|---|---|---|
| `VerifyOrigin` | Global | Rechaza métodos que modifican estado desde orígenes no permitidos |
| `VerifyCsrf` | Global | Exige `X-CSRF-Token` (sin opt-out) |
| `RequireAuth` | Grupo | 401 sin sesión; `CurrentUser::from()` |
| `RequireAdmin` | Grupo (tras RequireAuth) | 404 a no-admins |

### 5.5 Errores e idioma
- `HttpException(status, code, messageKey, params, fields)`: **claves**, no textos. `ErrorHandler` traduce con `Translator` (`backend/lang/<locale>`).
- Todo lo que no es `HttpException` → 500 genérico + log con `requestId`.
- `display_errors=0`; `debug` corto solo con `APP_DEBUG` fuera de producción.

### 5.6 Validación
`Validator::validate($input, $rules)` → solo campos declarados, strings recortados, errores `[clave, params]`. El frontend replica reglas para feedback inmediato; **el backend es la autoridad**.

## 6. API

### Convenciones
- Base `/api`, JSON only (415), camelCase en JSON, ULID como id público, fechas ISO 8601 UTC, dinero `{ amountMinor, currency }`.
- **Idioma:** el cliente envía `Accept-Language`; la respuesta trae `Content-Language` y `message`/`fields` localizados. Los `code` nunca se traducen.

### Envelope
```json
{ "data": { ... } }
{ "error": { "code": "validation_failed", "message": "Algunos campos necesitan tu atención.", "fields": { "email": "Ingresa un correo electrónico válido, como nombre@ejemplo.com." }, "requestId": "a1b2…" } }
```

### Códigos de estado
| Status | `code` | Significado |
|---|---|---|
| 400 | `invalid_json` | Body mal formado |
| 401 | `unauthenticated` / `invalid_credentials` | Sin sesión / credenciales inválidas |
| 403 | `csrf_invalid` / `origin_not_allowed` / `forbidden` | Protección o sin permiso |
| 404 | `not_found` | No existe, no tenés acceso o endpoint admin sin rol (indistinguible) |
| 405 | `method_not_allowed` | Método no soportado |
| 413 | `payload_too_large` | Body > `HTTP_MAX_BODY_BYTES` |
| 415 | `unsupported_media_type` | No es JSON |
| 422 | `validation_failed` | Errores por campo |
| 429 | `too_many_requests` | Rate limit (`Retry-After`) |
| 500 | `internal_error` | Error inesperado |

### Endpoints
| Método | Path | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Liveness |
| GET | `/auth/session` | — | Usuario actual (con `role`) o `null` + `csrfToken` |
| POST | `/auth/register` | — (rate limit) | Crea cuenta (rol `user`) e inicia sesión |
| POST | `/auth/login` | — (rate limit) | Inicia sesión |
| POST | `/auth/logout` | — | Cierra sesión |
| GET | `/projects` | ✔ | Proyectos propios |
| POST | `/projects` | ✔ (rate limit) | Crea proyecto |
| GET | `/projects/{projectId}` | ✔ | Proyecto accesible (404 si no); incluye `accessRole` |
| PATCH | `/projects/{projectId}` | ✔ owner/editor | Nombre y descripción |
| DELETE | `/projects/{projectId}` | ✔ owner | `{ confirmName }` |
| GET | `/projects/{projectId}/members` | ✔ con acceso | Owner + miembros |
| POST | `/projects/{projectId}/members` | ✔ owner (rate limit) | `{ email, role: editor\|viewer }` (cuenta existente) |
| PATCH | `/projects/{projectId}/members/{userId}` | ✔ owner | `{ role }` |
| DELETE | `/projects/{projectId}/members/{userId}` | ✔ owner o el propio miembro | Quitar acceso / salir |
| PATCH | `/account` | ✔ (rate limit) | Nombre y correo (correo requiere `currentPassword`) |
| POST | `/account/password` | ✔ (rate limit) | Cambia contraseña; cierra otras sesiones; nuevo `csrfToken` |
| PATCH | `/account/preferences` | ✔ | `{ locale }` |
| DELETE | `/account` | ✔ (rate limit) | `{ currentPassword, confirmation: "ELIMINAR" }` |
| GET | `/billing/overview` | ✔ | Plan, próximo pago, historial, planes (solo lectura) |
| GET · POST | `/projects/{projectId}/card-sorts` | ✔ con acceso / owner-editor | Card Sorting ([módulo](modules/card-sorting.md)) |
| GET · PATCH · DELETE | `/card-sorts/{studyId}` | ✔ con acceso / owner-editor | Estudio (incluye lector compartido) |
| POST | `/card-sorts/{studyId}/status` | ✔ owner-editor | publish · pause · resume · close |
| GET · DELETE | `/card-sorts/{studyId}/report` · `/responses` | ✔ con acceso / owner-editor | Resultados |
| GET · POST · DELETE | `/card-sorts/{studyId}/viewers[/{userId}]` · GET `/card-sorts/shared` | ✔ | Compartir en modo lectura |
| GET · POST | `/public/card-sorts/{code}` · `/responses` · `/screening` · `/complete` | — (rate limit por IP) | Participación anónima |
| GET | `/projects/{projectId}/notes` | ✔ con acceso | Notas de producto ([módulo](modules/product-context.md)) |
| POST | `/projects/{projectId}/notes` | ✔ owner/editor (rate limit) | `{ title, body }` |
| PATCH | `/projects/{projectId}/notes/{noteId}` | ✔ owner/editor (rate limit) | `{ title, body }` |
| DELETE | `/projects/{projectId}/notes/{noteId}` | ✔ owner/editor | Elimina la nota |
| GET | `/projects/{projectId}/context-prompt` | ✔ con acceso | Resumen guardado + `isStale`, `aiConfigured` |
| POST | `/projects/{projectId}/context-prompt` | ✔ owner/editor (rate limit) | Regenera el resumen con IA (503 si no hay clave o falla) |

## 7. Autenticación
- Email + contraseña (12–256), Argon2id, rehash transparente.
- Sesión PHP: `HttpOnly`, `SameSite=Lax`, `Secure` + `__Host-` en HTTPS, strict mode, timeouts (8 h inactividad / 7 días absoluto), regeneración de ID y rotación CSRF en login/registro/logout.
- Usuario recargado desde DB en cada request (estado y rol actualizados al instante).
- Mensaje de login uniforme; rate limit por IP y cuenta+IP.
- **Cuenta debug local** (`debug@debug.com`, rol admin) creada solo con `bin/seed-debug-user.php` en `development` ([ADR 0009](decisions/0009-platform-roles-and-debug-account.md)).
- Futuro: verificación de email, recuperación/cambio de contraseña, 2FA.

## 8. Autorización

**authentication + authorization + resource ownership + scoped access.**
1. `RequireAuth` en el grupo. 2. Identidad solo desde `CurrentUser::from()`. 3. Scope en SQL. 4. Policy en el service. 5. Ajeno/inexistente/mal formado ⇒ mismo 404.

**Roles de proyecto** ([ADR 0011](decisions/0011-project-sharing-roles.md)): `owner` (`projects.owner_user_id`), `editor` y `viewer` (`project_members`). El scope SQL es owner **o** membresía y resuelve `accessRole`; `ProjectPolicy` decide cada acción. Sin acceso ⇒ 404; con acceso sin permiso ⇒ 403.

**Sesiones y contraseña:** `users.auth_version` se guarda en la sesión; cambiar la contraseña lo incrementa y cierra las demás sesiones ([ADR 0012](decisions/0012-account-self-service-and-billing-read-model.md)).

**Roles de plataforma** (`users.role`): `user` | `admin`. `admin` solo habilita endpoints de administración con `RequireAdmin`; **no** otorga acceso a proyectos ajenos. El rol nunca se modifica vía API pública.

**Futuro (equipos):** `projects.workspace_id` + `workspace_members(role)`; cambian solo Repository (scope por membresía) y Policy.

## 9. Base de datos
MySQL/MariaDB InnoDB utf8mb4, UTC, migraciones forward-only, `public_id` ULID, `users.role`, `users.locale` (default `es`). Detalle: [DATABASE.md](DATABASE.md).

## 10. Internacionalización (i18n)
Producto nativo en español; cambio de idioma preparado en frontend (catálogos tipados) y backend (`lang/`). Guía completa: **[I18N.md](I18N.md)**.

## 11. Variables de entorno

| Archivo | Uso | Commit |
|---|---|---|
| `backend/.env.example` | Plantilla | ✔ |
| `backend/.env` | Secretos (DB, `GROQ_API_KEY`), `APP_ENV`, `APP_LOCALE`, sesión, IA | ✘ |
| `frontend/.env.example` | Plantilla | ✔ |
| `frontend/.env.local` | Overrides locales | ✘ |

- Todo `VITE_*` es público. `SORAQ_DEV_API_TARGET` solo lo lee `vite.config.ts`.
- `APP_ENV` sin definir ⇒ producción. `APP_LOCALE` default `es`.
- IA: `AI_PROVIDER` (`groq`), `GROQ_API_KEY` (secreto; vacío ⇒ IA no configurada), `GROQ_MODEL`, `AI_TIMEOUT_SECONDS`, `AI_MAX_INPUT_CHARS` ([ADR 0013](decisions/0013-ai-provider-groq-context-prompt.md)).

## 12. Preparación para billing, entitlements y límites
No implementado. Servicio `Entitlements` (`canUse`, `limit`) sobre `plans` + `subscriptions` + overrides (education/creator); consumo en `usage_records`; proveedor de pagos aislado en módulo `Billing`. Ver [DATABASE.md §4](DATABASE.md#4-entidades-futuras-no-implementadas).

## 13. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase, uno por archivo | `ItemSwitcher.tsx` |
| Hooks | `useXxx` | `useWorkspace` |
| Archivos TS no-componente | camelCase | `projectNavigation.ts` |
| Carpetas de features | kebab-case | `card-sorting/` |
| Clases Tailwind | Solo tokens semánticos | `bg-surface text-muted` |
| Claves i18n | `namespace.grupo.clave` camelCase | `workspace.sectionPage.itemsTitle` |
| Slugs de URL | kebab-case inglés, estables | `/navigation/card-sorting` |
| Clases PHP | PascalCase, namespace = ruta | `Soraq\Modules\Auth\RequireAdmin` |
| Claves `lang` PHP | `archivo.clave` snake_case | `errors.project_not_found` |
| Tablas / columnas | snake_case | `owner_user_id`, `created_at` |
| Migraciones | `YYYY_MM_DD_NNNNNN_descripcion.sql` | `2026_09_17_000004_add_role_to_users.sql` |
| Auditoría | `<módulo>.<evento>` | `project.created`, `admin.*` |
| Ramas | `feature/`, `fix/`, `docs/`, `security/` | `feature/tree-testing` |

## 14. Flujo localhost
```
http://localhost:5173           Vite (frontend)
http://localhost:5173/api/*  ─► http://localhost/SoraqSystem/backend/public/*  (Apache/PHP)
```
Arranque en [README.md](../README.md). Cuenta debug: `php backend/bin/seed-debug-user.php`.

## 15. Producción
**Nunca** tocar soraq.app durante el desarrollo. Procedimiento completo: [DEPLOYMENT.md](DEPLOYMENT.md).
```
domains/soraq.app/
├── public_html/          ← frontend/dist
│   └── api/              ← backend/public
└── soraq-backend/        ← backend (src, config, lang, .env, storage…) fuera del web root
```

## 16. Cómo agregar un módulo (ejemplo: Card Sorting)

Card Sorting es un ítem de **Planear → Navegación → Arquitectura** (`/app/projects/:id/navigation/card-sorting`).

1. **Entender** — PRODUCT (contexto que consume/produce), NAVIGATION, GUIDELINES, SECURITY_AUDIT.
2. **Ficha** — `docs/modules/card-sorting.md` desde `_TEMPLATE.md`.
3. **Base de datos** — migración con tablas `public_id`, FK a `projects`. Actualizar DATABASE.md.
4. **Backend** — `src/Modules/CardSorting/` copiando la anatomía de `Projects`; el scope valida que el proyecto sea accesible por el usuario. Línea en `config/modules.php`. Mensajes en `backend/lang/es/`.
5. **Frontend** — `src/features/card-sorting/` (api, model, components, pages, index). Montar su página en `features/workspace/routes.tsx` con una ruta más específica que el placeholder (p. ej. `navigation/card-sorting/*`) y obtener el proyecto con `useWorkspace()`. Textos en `i18n/locales/es/cardSorting.ts`.
6. **Reutilizar** — componentes de `@/design-system`; si falta uno genérico, agregarlo ahí.
7. **Probar** — typecheck, lint, build, smoke + casos IDOR del módulo, teclado, mobile, tema claro/oscuro.
8. **Auditar** — [SECURITY_AUDIT.md](SECURITY_AUDIT.md) (endpoints + tablas ⇒ obligatorio).
9. **Documentar** — CHANGELOG, ficha, ARCHITECTURE (endpoints).

**No se toca:** auth, otros módulos, `theme.css`, `projectNavigation.ts` (el ítem ya existe), layouts.
