# Checklist de auditoría de Soraq

Aplicar cada punto **al alcance** (lo cambiado desde la última auditoría). Registrar por punto: **OK / N/A / Hallazgo** + evidencia.
Fuentes de verdad: `docs/SECURITY_AUDIT.md`, `docs/GUIDELINES.md`, `docs/ARCHITECTURE.md`, `docs/NAVIGATION.md`, `docs/I18N.md`, `docs/SEO.md`, `docs/BRAND.md`.
Marcado **[auto]** = cubierto por `automated-checks.sh` (verificar el resultado, no repetir a mano).

---

## A. Calidad y build
- A1 [auto] TypeScript strict sin errores.
- A2 [auto] ESLint sin errores (jsx-a11y strict, fronteras entre features, sin HeroUI directo, sin HTML crudo).
- A3 [auto] Build de producción OK; sin source maps.
- A4 [auto] `npm audit --omit=dev` sin vulnerabilidades altas/críticas; dependencias nuevas justificadas en `ARCHITECTURE.md §2` (mantenimiento, licencia, tamaño).
- A5 [auto] Sintaxis PHP OK; migraciones aplicadas en local.
- A6 Sin código muerto, archivos huérfanos ni exports sin uso introducidos por el cambio.
- A7 [auto] Sin `console.log`, `var_dump`, `print_r`, TODO/FIXME sin ticket.

## B. Autenticación y sesiones
- B1 Contraseñas solo vía `PasswordHasher`; nunca en logs, respuestas ni auditoría.
- B2 Acciones sensibles (correo, contraseña, eliminación, pagos, permisos críticos) requieren re-autenticación.
- B3 Cambios de privilegio/credenciales regeneran sesión y rotan CSRF (`AuthSession::begin`).
- B4 Cambio de contraseña incrementa `auth_version` (otras sesiones cerradas) — probado con dos sesiones.
- B5 Mensajes de login/recuperación no permiten enumerar cuentas (o riesgo aceptado y documentado).
- B6 Rate limits definidos en `config/rate_limits.php` para endpoints sensibles o costosos nuevos.

## C. Autorización y control de acceso (IDOR)
- C1 Todo endpoint privado dentro de `RequireAuth`; admin con `RequireAdmin`.
- C2 Identidad solo desde `CurrentUser::from()`; ningún `user_id`/`owner_id`/`role`/`plan`/`price` aceptado del cliente para decidir acceso.
- C3 Repositorios con **scope en el SQL** (owner o membresía); sin métodos "find" sin scope para datos de usuario.
- C4 Recursos anidados validan la cadena completa (p. ej. estudio ∈ proyecto accesible).
- C5 `ProjectPolicy` (o la policy del módulo) decide cada acción; tabla de permisos actualizada en su docblock y en la ficha del módulo.
- C6 Sin acceso ⇒ 404 idéntico (inexistente / ajeno / id malformado); con acceso sin permiso ⇒ 403.
- C7 Matriz de acceso probada con curl (anónimo, sin acceso, viewer, editor, owner, admin sin acceso) y **agregada al smoke test**.
- C8 Admin de plataforma no hace bypass de ownership.
- C9 Mass assignment: `Validator` solo devuelve campos declarados; campos extra en el body no tienen efecto (probado).
- C10 El frontend refleja permisos (UX) pero ninguna acción depende solo de ocultar botones.

## D. API y datos
- D1 Validación backend de todos los inputs (tipos, longitudes, `in:` para enumerados, formatos).
- D2 JSON only; tamaño de body limitado; métodos no soportados ⇒ 405.
- D3 Respuestas con `toPublicArray()`/shape explícita: sin ids internos, hashes, tokens ni datos de terceros innecesarios.
- D4 [auto] SQL 100% parametrizado; identificadores dinámicos solo desde allowlist; `LIMIT` en listados.
- D5 Migraciones forward-only, pequeñas, con FKs y `ON DELETE` coherentes con privacidad; nunca se editó una migración aplicada.
- D6 Datos personales mínimos; retención definida en `DATABASE.md` para datos nuevos.
- D7 Dinero en unidades menores + ISO 4217; fechas en UTC e ISO 8601.
- D8 Operaciones multi-paso con transacción cuando corresponda.
- D9 Eliminaciones: confirmación server-side para acciones irreversibles; cascadas verificadas.

## E. Protección web
- E1 [auto] Sin `dangerouslySetInnerHTML`/`innerHTML`; URLs de usuario validadas (`https:`) antes de usarse en `href/src`.
- E2 CSRF global activo; ningún GET modifica estado.
- E3 Redirecciones solo internas (`isSafeRedirect`).
- E4 [auto] Headers de seguridad del API; CSP de producción (`public/.htaccess`) compatible con los cambios (sin inline scripts; estilos solo vía clases o CSSOM).
- E5 [auto] Archivos internos no accesibles por HTTP.
- E6 [auto] Sin secretos en código ni `VITE_*`; `.env` ignorado.
- E7 [auto] Errores sin SQL, stack traces, rutas ni nombres de clases.
- E8 Uploads (si hay): allowlist por contenido, tamaño, nombre aleatorio, fuera del web root, servidos con autorización, sin ejecución.
- E9 Logs técnicos sin datos sensibles; claves nuevas sensibles añadidas a la redacción del `Logger` si aplica.
- E10 Acciones relevantes registradas en `audit_logs` con nombre `<módulo>.<evento>` y `metadata` sin datos privados.

## F. UX y heurísticas
- F1 Visibilidad del estado: loading con texto específico, `isLoading` en botones, feedback de éxito.
- F2 Lenguaje del diseñador (sin jerga técnica); coherente con `BRAND.md` (tuteo neutro).
- F3 Control y libertad: cancelar, volver, Escape, confirmaciones para destructivos.
- F4 Consistencia: componentes de `@/design-system`, patrones existentes (SettingsPanel, EmptyState, PageHeader).
- F5 Prevención de errores: validación antes de enviar, límites (`maxLength`), botones deshabilitados hasta cumplir confirmaciones.
- F6 Reconocer antes que recordar: labels visibles, hints persistentes, navegación clara.
- F7 Estética minimalista: una acción primaria por región (`contrast` máx. 1).
- F8 Recuperación de errores: mensaje con causa + solución, foco al problema.
- F9 Estados completos donde aplique: default, hover, focus, active, disabled, loading, success, error, warning, empty, selected, sin permiso, no disponible.
- F10 Leyes de UX relevantes aplicadas y sin anti-patrones (Hick en menús, Fitts en targets, Von Restorff en CTA, Peak-End en confirmaciones).
- F11 Honestidad: nada presentado como disponible si no lo está (p. ej. pagos).

## G. Accesibilidad (WCAG 2.2 AA)
- G1 Un único `<h1>` por página; jerarquía de headings sin saltos; `data-page-heading` para foco tras navegar.
- G2 Landmarks correctos y con nombre cuando se repiten (`nav`, `aside`, `section` con `aria-labelledby`).
- G3 HTML semántico antes que ARIA; ARIA válido (sin roles redundantes, ids referenciados existentes).
- G4 Teclado: todo operable; orden lógico; sin trampas (salvo modales); Escape cierra overlays.
- G5 Foco visible en todo control; foco inicial correcto en diálogos (primer campo o cancelar en destructivos).
- G6 Nombres accesibles en controles solo-ícono (`IconButton label`), links descriptivos.
- G7 Formularios: label asociado, `aria-invalid`, error vinculado, foco al primer error, `autocomplete` correcto.
- G8 [auto] Contraste de tokens (texto ≥ 4.5:1, no-texto ≥ 3:1) en oscuro y claro; revisar pares nuevos no cubiertos por el script.
- G9 Información no dependiente solo del color (ícono + texto en estados y roles).
- G10 Target size ≥ 24×24 px.
- G11 Contenido en hover/focus: visible con teclado, descartable y persistente (1.4.13).
- G12 `prefers-reduced-motion` respetado; animaciones en loop pausables (2.2.2).
- G13 Zoom 200% y reflow a 320 px sin pérdida de contenido.
- G14 Tablas con `caption`/`th scope`; listas con `ul/ol`; imágenes decorativas `aria-hidden`.
- G15 Mensajes de estado dinámicos anunciados (`role="status"`/`alert`).

## H. Responsive y temas
- H1 375 / 768 / 1280 / 1536 px sin scroll horizontal ni solapamientos.
- H2 Sidebars/drawer del workspace correctos en cada breakpoint.
- H3 Modales usables en mobile (scroll interno, acciones visibles).
- H4 Tablas: scroll contenido o alternativa en mobile.
- H5 Modo oscuro **y** claro: sin colores hardcodeados, sin texto invisible, brillos/decoración correctos.

## I. Frontend quality, i18n y SEO
- I1 Links internos válidos (`config/paths.ts`); sin links rotos ni `href="#"`.
- I2 Routing: rutas nuevas con guard correcto, 404 de fallback, slugs estables (sin renombres sin redirección).
- I3 [auto] i18n: sin claves faltantes/sin uso ni textos hardcodeados; frases completas (sin concatenar); plurales con `{count}`.
- I4 Mensajes nuevos del API como claves en `backend/lang/es`.
- I5 Fechas/números/dinero con `shared/i18n/format.ts`.
- I6 `usePageMeta` en cada página nueva (title, noindex para privadas).
- I7 [auto] `robots.txt`, `sitemap.xml` actualizados si hay páginas públicas nuevas; canonical y Open Graph correctos.
- I8 Consola del navegador sin errores ni warnings de React.

## J. Arquitectura, mantenibilidad y documentación
- J1 Cada cambio en el lugar correcto (feature/módulo, design system, shared, core); sin imports cruzados de internals.
- J2 Lógica de negocio fuera de UI y controllers; controllers delgados.
- J3 Sin duplicación evitable; componentes genéricos en `design-system`.
- J4 [auto] Archivos razonables en tamaño (> 350 líneas: justificar o dividir).
- J5 Archivos globales modificados solo con justificación (`WORKFLOW.md §3`).
- J6 `CHANGELOG.md` actualizado.
- J7 ADR nuevo si cambió una decisión (el anterior marcado como reemplazado).
- J8 Ficha en `docs/modules/` creada/actualizada (endpoints, permisos, estados, auditoría).
- J9 `ARCHITECTURE.md §6` (endpoints), `DATABASE.md` (tablas), `NAVIGATION.md` + `_SITEMAP.md` (navegación) sincronizados.
- J10 `TESTING.md` con los flujos nuevos; smoke test ampliado y con limpieza de datos.
- J11 `DEPLOYMENT.md` con pasos nuevos (migraciones con efectos, variables de entorno, verificaciones post-deploy).
- J12 `SECURITY_AUDIT.md` con riesgos aceptados nuevos y eventos de auditoría actualizados.
