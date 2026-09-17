# Módulo: Auth (+ Users)

| | |
|---|---|
| Tipo | PLATFORM |
| Área | Plataforma |
| Estado | Disponible (v0.1.0) |
| Backend | `backend/src/Modules/Auth/`, `backend/src/Modules/Users/` |
| Frontend | `frontend/src/features/auth/` |

## Propósito
Registro, inicio y cierre de sesión. Provee a los demás módulos la identidad del usuario autenticado.

## Contratos públicos (para otros módulos)
| Backend | Uso |
|---|---|
| `AuthModule::requireAuth($services)` | Middleware para grupos de rutas privadas |
| `CurrentUser::from($request)` | Obtener el `User` autenticado (única fuente de identidad) |
| `Users\User` | Entidad (usar `toPublicArray()` para exponer); `isAdmin()` |
| `AuthModule::requireAdmin()` | Middleware para endpoints de administración (después de `requireAuth`; 404 a no-admins) |

| Frontend (`@/features/auth`) | Uso |
|---|---|
| `useAuth()` | `status`, `user`, `login`, `register`, `logout`, `refresh` |
| `RequireAuth`, `RedirectIfAuthenticated` | Guards de rutas (UX) |
| `AuthProvider` | Montado en `App.tsx` |
| `AccountMenu` | Menú de cuenta (cambio de modo + cerrar sesión), variantes `full` / `compact` (workspace) |
| `SignOutButton`, `UserAvatar` | Controles flotantes fuera de proyecto (`AppLayout`) |

## Datos
Tabla `users` ([DATABASE.md](../DATABASE.md#users)), incluye `role` (`user`/`admin`, [ADR 0009](../decisions/0009-platform-roles-and-debug-account.md)). Sesión en archivos (`storage/sessions`).

## Endpoints
| Método | Path | Auth | Rate limit | Descripción |
|---|---|---|---|---|
| GET | `/auth/session` | — | — | `{ user \| null, csrfToken }` |
| POST | `/auth/register` | — | 5/h por IP | `{ displayName, email, password }` → 201 `{ user, csrfToken }` |
| POST | `/auth/login` | — | 20/15 min por IP · 5/15 min por cuenta+IP | `{ email, password }` → `{ user, csrfToken }` |
| POST | `/auth/logout` | — | — | → `{ user: null, csrfToken }` |

## Estados (UI)
| Estado | Cómo se muestra |
|---|---|
| `checking` | `LoadingState` "Verificando tu sesión…" (solo en rutas privadas) |
| `unavailable` | "No podemos conectar con Soraq" + Reintentar |
| error de campo | Mensaje bajo el campo + foco |
| error general (401, 429, red) | `Alert` danger arriba del formulario + foco |
| enviando | Botón con spinner + "Iniciando sesión…" / "Creando cuenta…" |

## Cuenta de debug (solo local)
`php backend/bin/seed-debug-user.php` crea/actualiza **Debug** · `debug@debug.com` · `debug1234` · rol `admin`. Se niega a correr fuera de `APP_ENV=development`.

## Auditoría
`auth.registered`, `auth.login`, `auth.login_failed`, `auth.logout`.

## Pendiente (antes de producción pública)
Verificación de email · recuperación de contraseña · cambio de contraseña (invalida otras sesiones) · eliminación de cuenta · preferencias locale/timezone editables.

## Historial
| Fecha | Cambio |
|---|---|
| 2026-09-16 | Versión inicial |
| 2026-09-17 | Rol de plataforma, `RequireAdmin`, mensajes en español, AccountMenu/SignOutButton, cuenta debug |
