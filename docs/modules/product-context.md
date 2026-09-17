# Módulo: ProductContext — notas de producto y Context Prompt

| | |
|---|---|
| Tipo | NATIVE |
| Área | Investigación → Producto · Documentación → Context Prompt |
| Estado | Disponible (v0.4.0, sin publicar) |
| Backend | `backend/src/Modules/ProductContext/` (+ `backend/src/Modules/Ai/`) |
| Frontend | `frontend/src/features/product-context/` (montado por `features/workspace/pages/modules/`) |

## Propósito
- **Producto**: el diseñador crea tantas notas como quiera (título + contenido) con lo esencial del producto: Problemática, Objetivos, Soluciones, POV, MVP, Contexto… Se muestran en un tablero *masonry* y se guardan completas.
- **Context Prompt**: resume esas notas con IA (Groq, [ADR 0013](../decisions/0013-ai-provider-groq-context-prompt.md)), unificando temas similares, para copiarlo y pegarlo en la IA o agente con el que se construye el producto.

## Contexto de proyecto
| Consume | Produce |
|---|---|
| Proyecto (nombre, descripción) · notas | Resumen del contexto de producto (reutilizable por módulos futuros) |

## Datos
`product_notes` y `project_context_prompts` (migración 000009, [DATABASE.md](../DATABASE.md)). Se borran con el proyecto. Máx. 200 notas por proyecto; título ≤ 120, contenido ≤ 5000 caracteres.

## API
| Método | Path | Permiso | Notas |
|---|---|---|---|
| GET | `/projects/{projectId}/notes` | cualquier acceso | Más recientes primero |
| POST | `/projects/{projectId}/notes` | owner, editor | `{ title, body }` · 409 `limit_reached` |
| PATCH | `/projects/{projectId}/notes/{noteId}` | owner, editor | `{ title, body }` |
| DELETE | `/projects/{projectId}/notes/{noteId}` | owner, editor | 204 |
| GET | `/projects/{projectId}/context-prompt` | cualquier acceso | `summary`, `generatedAt`, `noteCount`, `summarizedNoteCount`, `isStale`, `aiConfigured` |
| POST | `/projects/{projectId}/context-prompt` | owner, editor | Regenera con IA · 409 `no_notes` · 503 `ai_not_configured` / `ai_unavailable` |

Sin acceso al proyecto ⇒ 404; nota de otro proyecto o id malformado ⇒ 404; viewer que escribe ⇒ 403.

## Estados (UI)
- Producto: cargando, error con reintento, vacío (temas sugeridos que precargan el título), lista, solo lectura (viewer), crear/editar en diálogo, eliminar con confirmación.
- Context Prompt: cargando / "Resumiendo tus notas con IA…", sin notas (link a Producto), IA no configurada (prompt con notas completas), desactualizado (alerta + actualizar), error de IA (se conserva el resumen anterior), copiado / copia fallida.

## Seguridad
- La clave de IA solo en el backend; nunca en respuestas ni logs (se registra solo el status HTTP).
- El texto de las notas se envía a Groq: declararlo en la política de privacidad antes de producción.
- El system prompt trata las notas como datos. La salida se muestra como texto plano (`<pre>`), nunca como HTML.
- Auditoría: `product_note.created|updated|deleted`, `context_prompt.generated`. Rate limits: `product_notes_write_per_user`, `context_prompt_generate_per_user`.
