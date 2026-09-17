# 0013 — Proveedor de IA (Groq) detrás de una interfaz, y Context Prompt resumido en el servidor

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |

## Contexto
Las notas de producto (Investigación → Producto) se guardan completas, pero el diseñador necesita un **Context Prompt** breve, con temas similares unificados, para pegar en la IA o agente con el que construye el producto. Resumir y agrupar requiere un modelo de lenguaje rápido, y Soraq usará IA en muchos más módulos a futuro.

## Decisión
- **Groq** (API compatible con OpenAI, `llama-3.3-70b-versatile` por defecto) como primer proveedor para tareas rápidas de texto.
- Las llamadas se hacen **solo desde el backend** (`Modules/Ai`): interfaz `AiClient`, implementación `GroqClient`, `AiClientFactory` lee `config/ai.php`. Los módulos dependen de la interfaz, nunca del proveedor.
- La clave vive solo en `backend/.env` / entorno del servidor (`GROQ_API_KEY`). Sin clave, la IA figura como **no configurada** y el Context Prompt muestra las notas completas.
- El resumen se **guarda** (`project_context_prompts`) con una huella (`source_hash`) de las notas: se marca desactualizado cuando cambian y se regenera al abrir la página (owner/editor) o con "Actualizar resumen". Leerlo no llama a la IA.
- El texto final del prompt (introducción + descripción + resumen) se arma en el frontend con i18n.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Llamar a Groq desde el navegador | Expondría la clave (`VITE_*` es público) |
| Resumir en cada lectura | Latencia y costo en cada visita, y resultados distintos cada vez |
| Resumir sin IA (concatenar) | No unifica temas similares; se mantiene solo como respaldo sin clave |
| SDK de un proveedor | Dependencia extra; `curl` alcanza para una API compatible con OpenAI |

## Consecuencias
- Positivas: cambiar o sumar proveedores (OpenAI, Anthropic, local) = nueva clase `AiClient` + config; ninguna feature cambia.
- Negativas / costos: el contenido de las notas se envía a un tercero (Groq) — debe figurar en la política de privacidad antes de producción. Rate limit `context_prompt_generate_per_user` para acotar costo. Las notas se tratan como datos (el system prompt ignora instrucciones dentro de ellas), pero la salida de un LLM nunca es 100 % confiable: se muestra como texto plano, nunca como HTML.
