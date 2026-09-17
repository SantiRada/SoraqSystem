# 0009 — Rol de plataforma (`user` / `admin`) y cuenta de debug local

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-17 |

## Contexto
Se pidió que el usuario de debug tenga **acceso de admin**. No existían roles. El producto a futuro tendrá roles por workspace (equipos), que son un concepto distinto.

## Decisión
- Columna `users.role` (`user` por defecto, `admin`). Expuesta en el perfil propio (`role`).
- **Admin = administración de la plataforma únicamente** (endpoints futuros `/admin/*`). **No** otorga acceso a proyectos ni datos de otros usuarios: el ownership se mantiene.
- Middleware `RequireAdmin` (tras `RequireAuth`); responde **404** a no-admins para no revelar endpoints. Toda acción admin deberá auditarse como `admin.*`.
- El rol **nunca** se asigna desde el API; solo por migración/CLI.
- Cuenta de debug **solo local**, creada/actualizada con `php backend/bin/seed-debug-user.php` (se niega a correr si `APP_ENV` ≠ `development`):
  - Nombre `Debug` · `debug@debug.com` · contraseña `debug1234` · rol `admin`.
  - La contraseña incumple la política (mín. 12) a propósito: el seeder no pasa por el registro.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Admin ve todos los proyectos | Rompe la regla de privacidad por ownership; requeriría auditoría y consentimiento |
| Tablas `roles`/`permissions` | Sobreconstrucción para dos roles de plataforma |
| Crear el usuario debug en una migración | Las migraciones corren en producción |

## Consecuencias
- ✔ Estructura lista para un área de administración sin tocar el modelo de ownership.
- ✘ Riesgo: credenciales débiles conocidas. Mitigación: seeder solo en development + verificación obligatoria en [DEPLOYMENT.md](../DEPLOYMENT.md) de que `debug@debug.com` no existe en staging/producción.
- Roles de equipo (owner/editor/viewer por workspace) seguirán siendo otra tabla (`workspace_members`).
