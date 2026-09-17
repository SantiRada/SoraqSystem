# Auditoría de seguridad — Proyectos compartidos, autogestión de cuenta y facturación (v0.3.0)

| | |
|---|---|
| Fecha | 2026-09-17 |
| Responsable | Claude (asistente de desarrollo) — pendiente revisión humana |
| Motivo | Autorización (roles de proyecto), autenticación (cambio de contraseña, re-auth, invalidación de sesiones), base de datos (migraciones 000006–000008), nuevas APIs, datos personales y de facturación, eliminación de cuenta |
| Versión | 0.3.0 (sin commit) |

## Alcance
- **Backend:** `Modules/Projects/*` (scope con membresías, `ProjectPolicy`, `ProjectMemberService/Repository`, update/delete), `Modules/Account/*`, `Modules/Billing/*`, `Modules/Auth/AuthSession` (auth_version), `Users/UserRepository`, `Validator` (`in:`), `config/rate_limits.php`, `bin/seed-debug-user.php`.
- **Frontend:** `features/account` (menú, diálogo de perfil), `features/workspace/pages/settings/*`, `features/projects` (API y roles), `AuthProvider` (`updateUser`, `endSession`).
- **Endpoints nuevos:** `PATCH|DELETE /projects/{id}`, `GET|POST /projects/{id}/members`, `PATCH|DELETE /projects/{id}/members/{userId}`, `PATCH /account`, `POST /account/password`, `PATCH /account/preferences`, `DELETE /account`, `GET /billing/overview`.

## Checklist

| Área | Resultado | Notas |
|---|---|---|
| 4.1 Authentication | OK | Re-auth para correo/contraseña/eliminación; `auth_version` cierra otras sesiones; sesión actual regenerada con nuevo CSRF |
| 4.2 Authorization | OK | Policy central; 404 sin acceso, 403 con acceso sin permiso; acciones de miembros solo owner; "salir" solo sobre uno mismo |
| 4.2b Roles plataforma | OK | Admin no participa en `ProjectPolicy` |
| 4.3 IDOR | OK | Proyecto siempre resuelto con consulta con scope antes de actuar; `{userId}` se busca **dentro** del proyecto autorizado; cuenta y billing sin ids en URL |
| 4.4 Database | OK | Prepared statements; placeholders únicos (sin repetición con prepares nativos); `LIMIT` en listados; FKs con `ON DELETE` coherentes (pagos `SET NULL`) |
| 4.5 API | OK | Validación con allowlist (`in:editor,viewer`, `in:es`); confirmaciones server-side (nombre del proyecto, `ELIMINAR`) |
| 4.6 Información expuesta | Aceptado | Miembros ven nombre y email de colaboradores del mismo proyecto (necesario para colaborar). Billing solo del propio usuario |
| 4.8 Datos de usuarios | OK | Eliminación de cuenta en cascada; pagos anonimizados (`user_id` NULL) |
| 4.14 XSS | OK | Nombres/emails renderizados por React |
| 4.15 CSRF | OK | Global; token rotado tras cambio de contraseña y eliminación |
| 4.16 Sesiones | OK | Invalidación por `auth_version` verificada con dos sesiones |
| 4.17 Rate limiting | OK | `project_members_per_user` 30/h, `account_update` 10/h, `account_password` 5/15 min, `account_delete` 5/h |
| 4.19 Errores | OK | Mensajes en `lang/es`; sin datos internos |
| 4.20 Auditoría | OK | `project.updated/deleted/member_added/member_role_changed/member_removed/left`, `account.profile_updated/email_changed/password_changed/preferences_updated/deleted` verificados en `audit_logs` |
| 4.21 Dependencias | OK | Sin dependencias nuevas; `npm audit`: 0 |
| Billing | OK | Solo lectura; ningún dato de tarjeta; checkout deshabilitado |

## Verificaciones ejecutadas
```
bash backend/tests/smoke/api-smoke.sh --reset-rate-limits   → Passed: 62  Failed: 0
  (IDOR sobre PATCH/DELETE/members, viewer 403, editor puede editar pero no borrar, salir → 404,
   borrar con nombre incorrecto 422, email sin contraseña 422, contraseña actual incorrecta 422,
   segunda sesión cerrada tras cambio de contraseña, locale inválido 422, ELIMINAR requerido,
   cuenta eliminada no puede iniciar sesión; limpieza: 0 usuarios de prueba restantes)
UI: menú Perfil, pestañas del diálogo con datos reales, modo desde Preferencias, invitar/cambiar rol/quitar acceso,
    renombrar y eliminar proyecto confirmando el nombre → OK
```

## Hallazgos

| # | Severidad | Descripción | Acción | Estado |
|---|---|---|---|---|
| 1 | Medio (bloqueante producción) | Emails no verificados: compartir con un correo registrado por otra persona; cambio de correo sin verificar el nuevo | Implementar verificación de email antes del lanzamiento | Pendiente |
| 2 | Bajo | Enumeración de cuentas registradas al dar acceso (usuarios autenticados) | Rate limit 30/h; revisar con invitaciones verificadas | Aceptado |
| 3 | Bajo | Todas las sesiones existentes se cierran una vez al desplegar `auth_version` | Comunicar en release notes | Aceptado |
| 4 | Informativo | Datos de facturación de ejemplo solo en local (seed debug) | Ya bloqueado fuera de development | OK |

## Conclusión
Sin hallazgos críticos ni altos. El hallazgo 1 se suma a la lista de bloqueantes previos al lanzamiento público.
