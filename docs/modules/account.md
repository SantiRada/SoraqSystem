# Módulo: Account (+ Billing de solo lectura)

| | |
|---|---|
| Tipo | PLATFORM |
| Estado | Disponible (v0.3.0; Perfil como página desde v0.4.0) |
| Backend | `backend/src/Modules/Account/`, `backend/src/Modules/Billing/` |
| Frontend | `frontend/src/features/account/` |
| Decisión | [ADR 0012](../decisions/0012-account-self-service-and-billing-read-model.md) |

## Propósito
Autogestión de la cuenta desde **Perfil** (menú del usuario → página `/app/account/{profile|billing|session|preferences}`, con barra de links y "Volver" al lugar desde donde se abrió): datos, contraseña, pagos, sesión, eliminación, idioma y modo. Cerrar sesión pide confirmación.

## Endpoints
| Método | Path | Rate limit | Descripción |
|---|---|---|---|
| PATCH | `/account` | 10/h | `{ displayName, email, currentPassword? }` — `currentPassword` obligatorio si cambia el email |
| POST | `/account/password` | 5/15 min | `{ currentPassword, newPassword }` → `{ user, csrfToken }`; cierra las demás sesiones |
| PATCH | `/account/preferences` | — | `{ locale }` (solo locales soportados) |
| DELETE | `/account` | 5/h | `{ currentPassword, confirmation: "ELIMINAR" }` → `{ user: null, csrfToken }` |
| GET | `/billing/overview` | — | `{ subscription, payments, plans, checkoutAvailable }` |

Todos requieren sesión y actúan **solo** sobre el usuario de la sesión (no hay ids en la URL).

## Datos
`users.auth_version`, `users.locale`; `plans`, `subscriptions`, `payments` ([DATABASE.md](../DATABASE.md)).

## UI — páginas de Perfil (`pages/AccountLayout`, `pages/AccountSectionPage`; antes `ProfileDialog`)
| Pestaña | Contenido |
|---|---|
| **Perfil** | Resumen (avatar, nombre, rol, email, contraseña oculta) · Cambiar nombre y correo (pide contraseña actual solo si cambia el correo) · Cambiar contraseña (actual, nueva, repetir) |
| **Pagos** | Plan activo + estado · Próximo pago (importe y fecha) · Cambiar plan (planes con precio, equivalente mensual del anual, requisito educativo; checkout deshabilitado con explicación) · Historial (tabla accesible) |
| **Sesión y cuenta** | Cerrar sesión · Eliminar cuenta (explicación de consecuencias, contraseña, escribir ELIMINAR) |
| **Preferencias** | Idioma (Select; hoy solo Español) · Modo (grupo de botones Oscuro/Claro) |

Se abre desde `AccountMenu` → **Perfil** en: esquina flotante (fuera de proyecto), sidebar expandido y rail del workspace.

## Estados
loading / error con reintento (Pagos) · éxito inline por formulario · errores por campo con foco · botones deshabilitados hasta cumplir confirmaciones · sin plan: "No tienes un plan activo" · sin pagos: mensaje vacío.

## Auditoría
`account.profile_updated`, `account.email_changed`, `account.password_changed`, `account.preferences_updated`, `account.deleted`.

## Pendiente
Verificación del nuevo email · proveedor de pagos (checkout, cambio real de plan, facturas descargables) · recuperación de contraseña · selector de idioma efectivo cuando exista un segundo idioma.
