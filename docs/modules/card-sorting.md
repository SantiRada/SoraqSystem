# Módulo: Card Sorting

| | |
|---|---|
| Tipo | NATIVE |
| Área | Planear → Navegación → Arquitectura → Card Sorting |
| Estado | Disponible (v0.4.0, sin publicar) |
| Backend | `backend/src/Modules/CardSorting/` |
| Frontend | `frontend/src/features/card-sorting/` (montado por `features/workspace/pages/modules/CardSortingRoutes.tsx`) |
| Decisión | [ADR 0015](../decisions/0015-card-sorting-studies.md) |

## Propósito
Estudios de card sorting **abiertos, híbridos o cerrados**: el diseñador define el inventario de cards y el flujo, publica un enlace anónimo para participantes y analiza los resultados (preguntas, participantes, matriz de similitud, dendrograma y clusters).

## Rutas
| Ruta | Pantalla |
|---|---|
| `/app/projects/:projectId/navigation/card-sorting` | Lista de estudios del proyecto |
| `/app/projects/:projectId/navigation/card-sorting/:studyId` | Dashboard: **Contenido · Reporte · Configuración** (Reporte aparece al publicar) |
| `/app/shared/card-sorting/:studyId` | Dashboard en modo lectura para personas con quienes se compartió el estudio |
| `/cardsorting/:projectSlug/:code` | Flujo público del participante (`noindex`, `Disallow` en robots.txt) |

## Estados
`draft` (en edición, sin enlace) → **Publicar** → `active` ⇄ `paused` (Pausar / Reanudar) → **Cerrar** → `closed` (definitivo).
El código del enlace (8 caracteres) y el slug del proyecto se fijan en la primera publicación. Editar un estudio publicado solo afecta a participantes futuros: cada respuesta guarda un **snapshot** de cards, categorías y preguntas.

## Documento del estudio
- **Contenido** (pasos): Nombre, propósito y participantes · Tarjetas (descripción opcional, orden aleatorio, reordenar arrastrando) · Tipo y categorías (orden aleatorio) · Flujo (secciones colapsables; botón Publicar al final).
- **Flujo**, en orden: bienvenida → contexto (opcional) → preguntas de validación (opcional, opción única; cada opción continúa o termina con el mensaje de perfil no compatible) → instrucciones (N pasos, Continuar / Saltar) → actividad → preguntas post-estudio (opcional: estrellas, escala, texto, opción única, selección múltiple; obligatorias u opcionales; las de texto admiten un texto de ayuda) → gracias. Además, mensaje de estudio cerrado.
- **Configuración**: texto de los botones Continuar / Finalizar, color de acento (se aplica al botón principal y a las opciones seleccionadas, con texto de contraste calculado), redes sociales (14, se muestran en el mensaje de gracias), compartir en modo lectura, eliminar resultados, eliminar estudio.
- Descripciones con **editor de texto enriquecido** (Tiptap): título/subtítulo, grosor, fuente, cursiva, listas y separador; Ctrl/Cmd+B y Ctrl/Cmd+I. Se guarda como JSON validado por allowlist (`RichText.php`), nunca HTML.
- Límites de seguridad (no visibles): 1000 tarjetas, 300 categorías, 20 preguntas por sección, 10 opciones, 10 pasos de instrucciones.

## API
| Método | Path | Permiso |
|---|---|---|
| GET | `/projects/{projectId}/card-sorts` | acceso al proyecto |
| POST | `/projects/{projectId}/card-sorts` | owner, editor · `{ name }` (contenido por defecto) |
| GET | `/card-sorts/shared` | autenticado |
| GET | `/card-sorts/{studyId}` | owner, editor, viewer, lector compartido |
| PATCH | `/card-sorts/{studyId}` | owner, editor · documento completo |
| DELETE | `/card-sorts/{studyId}` | owner, editor · `{ confirmName }` |
| POST | `/card-sorts/{studyId}/status` | owner, editor · `{ action: publish\|pause\|resume\|close }` |
| GET | `/card-sorts/{studyId}/report` | cualquier acceso |
| DELETE | `/card-sorts/{studyId}/responses` | owner, editor · `{ confirmName }` |
| GET · POST · DELETE | `/card-sorts/{studyId}/viewers[/{userId}]` | owner, editor |
| GET | `/public/card-sorts/{code}` | público |
| POST | `/public/card-sorts/{code}/responses` · `/screening` · `/complete` | público (token de sesión) |

Sin acceso ⇒ 404 (igual que inexistente o id malformado); acceso sin permiso ⇒ 403; un estudio en borrador no existe para el público (404).

## Análisis (cliente, `model/analysis.ts`)
- **Similitud** de un par = participantes que las pusieron en el mismo grupo / participantes que vieron ambas cards.
- **Dendrograma**: clustering jerárquico aglomerativo con enlace promedio; posición horizontal = similitud.
- **Clusters**: subárboles más altos con similitud promedio ≥ 50 %.
- **Nombres de categoría**: normalizados (mayúsculas, tildes y espacios) y sumados; se muestra la variante más usada y las variantes.
- Participantes que no calificaron no cuentan para matriz ni dendrograma.
- La matriz se dibuja como triángulo rectángulo en el orden del dendrograma: nombres en la hipotenusa, pares más similares junto a ella.
- Orden aleatorio: se decide por participante al iniciar (el servidor mezcla tarjetas y/o categorías).

## Seguridad
- Participantes anónimos: no se guarda IP, user agent ni datos personales; el token de sesión se guarda como sha256.
- Las reglas de validación (qué opción califica) nunca se envían al navegador.
- Envíos validados contra el snapshot: todas las cards ubicadas una sola vez, categorías cerradas solo predefinidas, respuestas dentro de las opciones y rangos.
- Rate limits: `card_sort_write_per_user`, `card_sort_share_per_user`, `card_sort_start_per_ip`, `card_sort_submit_per_ip`.
- Auditoría: `card_sort.created|updated|publish|pause|resume|close|deleted|responses_deleted|viewer_added|viewer_removed`.
- Enlaces de redes: solo `https://`, `target=_blank` con `rel="noopener noreferrer"`.

## Datos de ejemplo (solo local)
`php backend/bin/seed-card-sort-demo.php` crea en el primer proyecto de la cuenta debug un estudio híbrido publicado con 12 participantes sintéticos e imprime el enlace de participante.
