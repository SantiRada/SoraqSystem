# 0008 — Producto nativo en español con i18n preparado

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |
| Reemplaza a | [0006](0006-documentation-language-and-ui-language.md) |

## Contexto
Producto pide trabajar **todo el producto en español de forma nativa**, dejando preparado un futuro cambio de idioma sin que sea complejo.

## Decisión
- **Interfaz y mensajes del API en español** (neutro, tuteo). Documentación en español. Código, identificadores, slugs de URL y comentarios de código en inglés.
- **Frontend:** catálogos tipados por namespace en `src/i18n/locales/es/*.ts`. El catálogo español es la **fuente de verdad del tipo `Messages`**; claves `MessageKey` verificadas por TypeScript. `useI18n().t(key, params)` con interpolación `{param}` y plurales con `Intl.PluralRules`. `I18nProvider` sincroniza `<html lang>` y el `I18nProvider` de React Aria.
- **Backend:** `Core/I18n/Translator` + `backend/lang/<locale>/*.php`. `HttpException` y `Validator` transportan **claves**, no textos; `ErrorHandler` traduce según `Accept-Language` negociado entre `app.supported_locales` (default `APP_LOCALE=es`). Responde `Content-Language`.
- Sin librería externa de i18n por ahora (las necesidades actuales se cubren en ~100 líneas tipadas).
- Detalle operativo: [I18N.md](../I18N.md).

## Alternativas consideradas
| Alternativa | Por qué no (hoy) |
|---|---|
| i18next / FormatJS | Más dependencias y configuración para un solo idioma; migrables detrás de `useI18n` si aparecen necesidades (ICU complejo, carga remota) |
| Frontend traduce códigos de error del API | Duplica catálogos de errores; el backend ya conoce el mensaje correcto |

## Consecuencias
- ✔ Agregar un idioma = copiar carpetas `es` → `<code>`, traducir (TS avisa faltantes), registrar el locale.
- ✔ Formatos de fecha/número siguen el idioma de la interfaz.
- ✘ Los textos ya no pueden escribirse inline: todo string visible pasa por el catálogo (intencional).

## Reemplazo de 0006
1. **Por qué cambió:** decisión de producto de ser nativo en español.
2. **Afecta:** todos los textos visibles, `index.html`, manifest, OG, mensajes del API.
3. **No afecta:** idioma del código, nombres de rutas/slugs, estructura de datos (salvo default `users.locale = 'es'`).
4. **Archivos:** `frontend/src/i18n/**`, componentes con texto, `backend/lang/**`, `Core/I18n`, `HttpException`, `Validator`, `ErrorHandler`, `Application`, `Services`.
5. **Evitar modificaciones innecesarias:** los códigos de error (`code`) del API no cambiaron; solo `message`/`fields`.
