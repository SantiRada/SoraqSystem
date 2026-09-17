# Soraq — SEO y metadatos

## 1. Qué se indexa

| Área | Indexable | Cómo |
|---|---|---|
| `/` (home) y futuras páginas públicas de marketing | ✔ | `usePageMeta({ path })`, en `sitemap.xml` |
| `/register` | ✔ | Página de conversión |
| `/login` | ✘ | `noindex` (transaccional) |
| `/app/*` | ✘ | `noindex` + `Disallow` en robots.txt |
| `/api/*` | ✘ | `Disallow` en robots.txt |
| 404 / errores | ✘ | `noindex` |

## 2. Implementación

- **`index.html`**: `charset`, `viewport`, title y description por defecto, canonical, robots, `theme-color`, `color-scheme`, favicon SVG, apple-touch-icon, manifest, Open Graph (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` 1200×630 + alt, `og:locale`), `twitter:card`.
- **`usePageMeta`** (cada página, una vez): title `<Página> · Soraq`, description, robots, canonical y `og:*` actualizados en navegación cliente.
- **`public/robots.txt`** y **`public/sitemap.xml`**: actualizar el sitemap al agregar/quitar una página pública.
- **Semántica**: un `<h1>` por página, jerarquía de headings sin saltos, landmarks (`header`, `nav`, `main`, `footer`).

## 3. Limitación conocida (SPA)

Soraq es una SPA: el HTML inicial es el mismo para todas las rutas y los metadatos por página se aplican con JavaScript. Google ejecuta JS, pero otras plataformas (previews de redes sociales) leen solo el HTML inicial → verán los metadatos de la home.

- Suficiente mientras la única página pública relevante sea la home.
- Cuando existan varias páginas de marketing: **prerender** en build de las rutas públicas (plugin de Vite) o páginas estáticas. Requiere ADR.
- El servidor responde 200 para rutas inexistentes (fallback SPA) → "soft 404". Mitigado con `noindex` en la 404. Si se vuelve un problema: lista de rutas públicas conocidas en `.htaccess`.

## 4. Estrategia inicial de keywords

Intención principal: diseñadores **hispanohablantes** que buscan herramientas y flujos de trabajo UX con IA (producto nativo en español; al sumar idiomas, clusters por idioma con `hreflang`).

| Cluster | Keywords objetivo | Página |
|---|---|---|
| Core | herramienta UX con IA, espacio de trabajo UX, IA para diseño UX, flujo de trabajo UX | Home |
| Proceso | proceso de diseño UX, investigación UX, síntesis de investigación, arquitectura de información | Home / futuras páginas de sección |
| Testeos | test de usabilidad, card sorting, tree testing, test de 5 segundos, test A/B | Futuras páginas por estudio |
| Entregables | design system, handoff de diseño, documentación de diseño | Futuras páginas de Diseño/Entregables |

Términos en inglés que el público busca tal cual (card sorting, tree testing, design system, UX research) se usan donde son naturales.

Reglas:
- **Sin keyword stuffing.** Escribir para personas; la keyword aparece donde es natural (title, h1, primer párrafo).
- Una intención principal por página; no competir entre páginas propias por la misma keyword.
- No crear páginas para funcionalidades que no existen.
- Title ≤ 60 caracteres, description 120–160 caracteres.
