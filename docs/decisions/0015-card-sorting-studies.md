# 0015 — Estudios de Card Sorting: documento JSON validado, snapshots por respuesta y análisis en el cliente

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |

## Contexto
Card Sorting es el primer estudio con participantes externos. El diseñador configura mucho contenido anidado (cards, categorías, flow con preguntas y textos enriquecidos) que cambia a menudo, incluso con el estudio publicado, y los resultados deben seguir siendo válidos cuando el contenido cambia. Tree Testing y Sitemap reutilizarán el patrón.

## Decisión
1. **Documento JSON por estudio** (`card_sorts.content` / `settings`), reconstruido en el backend desde una allowlist estricta (`CardSortContent`, `Payload`, `RichText`) con límites duros. Se guarda completo con un `PATCH`.
2. **Snapshot por respuesta**: al empezar, cada participante recibe y congela la versión de cards y preguntas. Editar no altera resultados previos.
3. **Participación anónima con token** (sha256 en DB), reglas de validación evaluadas en el servidor, número de participante asignado al terminar.
4. **Análisis en el navegador** (similitud, clustering jerárquico con enlace promedio, clusters ≥ 50 %, normalización de nombres) a partir de las respuestas crudas.
5. **Texto enriquecido con Tiptap** guardado como JSON (no HTML) y renderizado con React desde la misma allowlist.
6. **Compartir en modo lectura por estudio** (`card_sort_viewers`) sin dar acceso al proyecto.
7. Íconos de redes con **simple-icons** (CC0; LinkedIn declarado localmente porque no se distribuye).

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Tablas normalizadas para cards, preguntas y opciones | Muchas migraciones y joins para un contenido que se edita como un todo; el snapshot por respuesta resuelve la historia |
| Guardar HTML de un editor | Riesgo de XSS y CSS inyectado; requiere sanitizador |
| Calcular análisis en PHP | Sin librerías; el volumen esperado (≤ 200 cards, miles de respuestas) es manejable en el cliente y permite interactividad inmediata |
| Compartir agregando al proyecto como viewer | Expondría todo el proyecto |

## Consecuencias
- Positivas: editar sin migraciones; resultados estables; mismo patrón para Tree Testing.
- Negativas / costos: el reporte descarga respuestas crudas (paginar o agregar en el servidor si superan ~5000); `StudyPage` pesa ~470 KB por Tiptap (carga diferida, solo para diseñadores); consultas SQL sobre el contenido no son posibles sin decodificar JSON.
