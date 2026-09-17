# 0012 — Autogestión de cuenta y modelo de lectura de facturación

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |

## Contexto
El menú del usuario debe ofrecer **Perfil**: datos (nombre, correo, contraseña), cambio de contraseña, cambio de nombre/correo, revisión de pagos (historial, próximo pago, plan activo, cambiar plan), cerrar sesión, eliminar cuenta, idioma y modo. No existe proveedor de pagos integrado (la etapa de billing real con Stripe u otro sigue pendiente).

## Decisión

### Cuenta (`Modules/Account`)
- Endpoints sin ids en la URL (siempre el usuario de la sesión): `PATCH /account`, `POST /account/password`, `PATCH /account/preferences`, `DELETE /account`.
- **Re-autenticación** con contraseña actual para: cambiar correo, cambiar contraseña, eliminar cuenta. Eliminar exige además escribir `ELIMINAR`.
- `users.auth_version`: cambiar la contraseña lo incrementa ⇒ **todas las demás sesiones se cierran**; la sesión actual se regenera (nuevo id + CSRF).
- Eliminar cuenta: hard delete; cascada de proyectos propios, membresías y suscripción; **los pagos se conservan** con `user_id = NULL` (obligaciones contables); auditoría `account.deleted` antes de borrar.
- Idioma guardado en `users.locale` (solo `es` hoy). Modo claro/oscuro: por dispositivo (localStorage).

### Facturación (`Modules/Billing`) — solo lectura
- Tablas `plans` (con precios de referencia sembrados), `subscriptions` (una actual por usuario) y `payments` (historial), montos en unidades menores + ISO 4217.
- `GET /billing/overview`: suscripción, próximo pago (fin del período si renueva), historial (24), planes activos y `checkoutAvailable: false`.
- "Cambiar plan" muestra los planes y un checkout **deshabilitado con explicación** hasta integrar un proveedor (principio de honestidad de disponibilidad).
- Datos de ejemplo solo para la cuenta debug local (`seed-debug-user.php`).

### Frontend (`features/account`)
- `AccountMenu` (Perfil, modo, cerrar sesión) en los tres contextos (esquina flotante, sidebar expandido, rail).
- `ProfileDialog` con pestañas: **Perfil · Pagos · Sesión y cuenta · Preferencias**, montado una vez por `AccountDialogProvider` dentro del router. *(Actualización 2026-09-17: reemplazado por páginas `/app/account/*` a pedido de producto; la lógica de cada sección no cambió.)*

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Página `/app/account` en vez de modal | Pedido explícito de modal |
| Simular cambio de plan sin proveedor | Engañoso; riesgo de estados inconsistentes con cobros reales |
| Soft delete de cuentas | Sin requisito legal/producto hoy; complica unicidad de email |
| Invalidar sesiones borrando archivos de sesión | Imposible identificar archivos por usuario con sesiones nativas |

## Consecuencias
- ✔ Autogestión segura (re-auth, cierre de otras sesiones, auditoría completa).
- ✔ El modelo de facturación ya es el que usará el proveedor (webhooks escribirán `subscriptions`/`payments`).
- ✘ Tras desplegar la migración 000006 todas las sesiones existentes se cierran una vez (no tienen `auth_version`).
- ✘ Sin verificación del nuevo correo al cambiarlo (pendiente junto con verificación de email).
