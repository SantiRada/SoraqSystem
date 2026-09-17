# Soraq — Estrategia de testing

> Estado v0.1.0: verificación estática + smoke test de API. La infraestructura de tests automatizados se incorpora cuando el primer módulo con lógica compleja lo justifique.

## 1. Lo que existe hoy

| Tipo | Herramienta | Comando | Cubre |
|---|---|---|---|
| Tipos | TypeScript strict | `npm run typecheck` | Contratos, nulls, imports |
| Lint + a11y estática | ESLint + jsx-a11y (strict) + react-hooks | `npm run lint` | Errores comunes, reglas de accesibilidad, fronteras entre features |
| Build | Vite | `npm run build` | Que el bundle de producción compile |
| Sintaxis PHP | `php -l` | ver abajo | Errores de sintaxis |
| **API smoke + control de acceso** | bash + curl | `bash backend/tests/smoke/api-smoke.sh --reset-rate-limits` | Health, 404/405, CSRF, Origin, 415, validación, registro, duplicados, IDOR entre usuarios, ids internos no expuestos, logout, credenciales inválidas |

> El registro está limitado a 5/hora por IP: sin `--reset-rate-limits` una segunda ejecución dentro de la hora termina con código 2 (comportamiento esperado). El flag vacía `rate_limits` **solo en la base local**.

```bash
# Lint de todo el backend (Git Bash)
find backend -name '*.php' -exec php -l {} \; | grep -v "No syntax errors"
```

## 2. Dónde irá cada tipo de test

| Tipo | Ubicación | Herramienta prevista | Cuándo incorporarla |
|---|---|---|---|
| Unit (frontend) | `frontend/src/**/<archivo>.test.ts` junto al código | **Vitest** | Primera lógica pura no trivial (ej. análisis de resultados de estudios) |
| Component (frontend) | `frontend/src/**/<Componente>.test.tsx` | Vitest + Testing Library | Componentes con lógica de interacción (ej. configurador de estudios) |
| Accessibility automatizada | tests de componente y E2E | `axe-core` (vitest-axe / @axe-core/playwright) | Junto con component/E2E |
| E2E | `frontend/e2e/*.spec.ts` | **Playwright** | Antes del primer deploy a producción de la nueva versión |
| Unit (backend) | `backend/tests/Unit/<Namespace>/…Test.php` | **PHPUnit** (Composer solo como dev) | Primer service con reglas complejas |
| Integration / API (backend) | `backend/tests/Integration/…Test.php` | PHPUnit + DB de test `soraq_test` | Cuando el smoke test bash no alcance |
| Security | `backend/tests/smoke/` + checklist manual | curl/bash, OWASP ZAP (baseline) | Cada auditoría ([SECURITY_AUDIT.md](SECURITY_AUDIT.md)) |

## 3. Reglas

- Tests **junto al módulo** que prueban: borrar un módulo borra sus tests.
- Cada módulo con datos de usuario incluye **tests de acceso cruzado** (usuario B no puede leer/modificar/borrar recursos de A → 404).
- Los tests nunca usan la base local de desarrollo ni producción: DB `soraq_test` dedicada.
- Nunca datos personales reales en fixtures.
- El smoke test crea usuarios desechables: **solo local/staging**.

## 4. Checklist manual (hasta tener E2E)

Cuenta local: `debug@debug.com` / `debug1234` (admin) — crear con `php backend/bin/seed-debug-user.php`.

- [ ] Toda la interfaz y los errores del API en español.
- [ ] Registro → Proyectos → foco en `<h1>`.
- [ ] Formularios vacíos: errores por campo y foco en el primero.
- [ ] **Proyectos (sin proyecto):** no hay sidebar; logo arriba a la izquierda; usuario, modo y "Cerrar sesión" arriba a la derecha.
- [ ] Crear proyecto desde el diálogo (foco en "Nombre del proyecto", Escape cierra) → llega al resumen con "Proyecto creado".
- [ ] Diálogos: Escape y clic afuera cierran; con texto escrito (crear proyecto, nota) piden "¿Descartar lo que escribiste?" (Escape en la confirmación vuelve a editar); Cancelar también pregunta.
- [ ] Cerrar sesión (menú de cuenta, botón flotante, Perfil → Sesión y cuenta) pide confirmación.
- [ ] Perfil: menú de cuenta → página Perfil con Datos personales · Pagos · Sesión y cuenta · Preferencias; "Volver" regresa al proyecto desde donde se abrió.
- [ ] Atajos en un proyecto: Ctrl/Alt+1 → Investigación; Shift+2 dentro de Investigación → Desktop Research; no actúan con un diálogo abierto ni Shift mientras se escribe.
- [ ] **Resumen del proyecto:** sidebar principal expandido con Planear / Diseño / Testeos / Entregables (no cliqueables) y sus secciones.
- [ ] **Contraer/expandir** el sidebar con el botón junto al logo (foco se mantiene en el botón; la preferencia persiste al recargar). En rail: etiqueta al hover y al foco, Escape la oculta.
- [ ] **Sección con ítems** (ej. Navegación): botones a Arquitectura/Flujos y sus ítems; sin barra de ítems.
- [ ] Ítem (ej. Card Sorting): barra de ítems arriba a la izquierda con el ítem activo marcado; ir a otro ítem (Tree Testing) desde la barra; scroll horizontal en mobile.
- [ ] URL de sección/ítem inexistente → "Esta sección no existe"; proyecto ajeno → "Proyecto no encontrado".
- [ ] < 1024 px: barra superior "proyecto · sección", drawer con la navegación del proyecto, se cierra al navegar.
- [ ] `/app/ruta-inexistente` → 404 con controles flotantes; `/ruta-inexistente` → 404 pública.
- [ ] Menú de cuenta (en proyecto): cambiar modo y cerrar sesión con teclado.
- [ ] Modo claro/oscuro persiste al recargar (sin parpadeo).
- [ ] **Card Sorting** (datos: `php backend/bin/seed-card-sort-demo.php`): crear estudio; recorrer los 5 pasos; editor de descripciones (Ctrl+B / Ctrl+I, listas, separador); guardar con la barra de cambios; salir sin guardar pide confirmación; publicar exige ≥ 2 cards (y categorías según tipo); copiar enlace; pausar → el enlace muestra "en pausa"; reanudar; cerrar (confirmación) → mensaje de estudio cerrado. Participante: bienvenida → contexto → validación (opción que termina → mensaje de perfil) → instrucciones (Continuar / Saltar) → tablero (arrastrar y "Mover a" con teclado, nombrar grupos) → preguntas obligatorias → gracias con redes. Reporte: preguntas con filtro y mayoría, participantes, matriz (hover y flechas resaltan fila/columna; lista de pares), dendrograma (hover/foco muestra nombres y variantes), clusters. Configuración: botones, color de acento con vista previa, redes, compartir con otra cuenta (ve en "Estudios compartidos contigo" sin poder editar), eliminar resultados y estudio escribiendo el nombre.
- [ ] **Producto**: crear nota desde un tema sugerido y desde "Nueva nota", editar, eliminar (confirmación); viewer ve solo lectura. **Context Prompt**: sin notas → link a Producto; sin `GROQ_API_KEY` → aviso + notas completas; con clave → resumen agrupado, se actualiza al abrir tras cambiar notas; Copiar prompt.
- [ ] **Configuración** (menú de cuenta → Configuración del proyecto): General guarda y actualiza el nombre en los sidebars; Acceso da acceso a una cuenta existente, cambia rol, quita acceso (confirmación); un editor/viewer ve Acceso en solo lectura y puede salir; Eliminar proyecto exige escribir el nombre y vuelve a Proyectos con aviso.
- [ ] **Perfil** (menú del usuario en las tres ubicaciones): pestañas Perfil / Pagos / Sesión y cuenta / Preferencias; cambio de correo pide contraseña; cambiar contraseña cierra otra sesión abierta; Pagos muestra plan, próximo pago e historial (debug: Standard + 3 pagos); Cambiar plan muestra planes con checkout deshabilitado; Eliminar cuenta exige contraseña + ELIMINAR; modo claro/oscuro desde Preferencias.
- [ ] Home: marquee pausable, reduced motion estático.
- [ ] Backend apagado → "No podemos conectar con Soraq" con reintento.

> Nota: si el panel del navegador de pruebas está en segundo plano, las animaciones/transiciones no avanzan (p. ej. el diálogo queda en `data-exiting`); no es un bug de la app.
