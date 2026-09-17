# Soraq — Entornos, deploy y rollback

> ⚠️ **Durante el desarrollo NO se modifica https://soraq.app.** Todo se trabaja en localhost. Este documento describe el procedimiento para cuando la nueva versión esté terminada y validada.

## 1. Entornos

| Entorno | URL | `APP_ENV` | Datos | Notas |
|---|---|---|---|---|
| Development | http://localhost:5173 | `development` | Locales, descartables | XAMPP + Vite |
| Staging (futuro) | p.ej. `staging.soraq.app` protegido con contraseña HTTP | `staging` | Ficticios | Mismo stack que prod; `noindex` |
| Production | https://soraq.app | `production` | Reales | Hostinger |

## 2. Estructura en Hostinger

```
/home/<usuario>/domains/soraq.app/
├── public_html/                 ← contenido de frontend/dist/
│   ├── .htaccess                (viene de frontend/public/.htaccess)
│   ├── index.html, assets/, robots.txt, sitemap.xml, …
│   └── api/
│       ├── index.php            ← backend/public/index.php
│       └── .htaccess            ← backend/public/.htaccess
└── soraq-backend/               ← backend/ SIN public/ (fuera del web root)
    ├── bootstrap/ config/ src/ database/ bin/
    ├── storage/{logs,sessions,uploads}   (escribible por PHP, permisos 750)
    └── .env                     (permisos 600)
```

`public_html/api/index.php` debe encontrar el backend: definir `SORAQ_BACKEND_ROOT=/home/<usuario>/domains/soraq.app/soraq-backend` como variable de entorno (hPanel / `.htaccess` con `SetEnv`) **o** ajustar esa única línea en la copia desplegada.

**Nunca desplegar:** el `.htaccess` raíz local, `_SITEMAP.md`, `node_modules`, `frontend/src`, `.git`, `backend/tests`, `backend/bin/seed-debug-user.php`, dumps, `.env.example` con datos reales.

**Sí desplegar:** `soraq-backend/lang/` (mensajes del API) junto con `src/` y `config/`.

## 3. Checklist de release

### Antes
- [ ] `CHANGELOG.md` actualizado con la versión.
- [ ] `npm run typecheck && npm run lint && npm run build` sin errores (en `frontend/`).
- [ ] `php -l` sobre todo `backend/` sin errores.
- [ ] Smoke test local verde: `bash backend/tests/smoke/api-smoke.sh`.
- [ ] **Auditoría de seguridad** completada y registrada en `docs/audits/` ([SECURITY_AUDIT.md](SECURITY_AUDIT.md)).
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas/críticas.
- [ ] Copy de la home revisado: nada presentado como disponible que no lo esté.
- [ ] Tag git `vX.Y.Z` creado sobre `main`.
- [ ] **Cuenta debug ausente:** `SELECT id FROM users WHERE email = 'debug@debug.com'` en la base destino → sin filas. Nunca correr `seed-debug-user.php` fuera de local.

### 1. Build
```bash
cd frontend && npm ci && npm run build      # genera frontend/dist
```

### 2. Backup (obligatorio)
- Backup completo en hPanel (archivos + DB) **y** `mysqldump` descargado localmente.
- Copia de `public_html/` actual (para rollback inmediato).

### 3. Configuración de entorno
- `soraq-backend/.env` con: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://soraq.app`, `APP_ALLOWED_ORIGINS=https://soraq.app`, credenciales DB de producción (usuario con privilegios mínimos), `SESSION_SECURE_COOKIE=true`, `APP_LOCALE=es`, `GROQ_API_KEY` de producción (clave distinta a la local) y `GROQ_MODEL`.
- **No ejecutar** `bin/seed-card-sort-demo.php` fuera de local (se niega si `APP_ENV` no es `development`).
- La extensión `curl` de PHP debe estar activa y con bundle de CA (llamadas HTTPS a `api.groq.com`).
- PHP ≥ 8.2 en hPanel; `display_errors=Off`, `expose_php=Off`.
- HTTPS activo (SSL) antes de publicar.

### 4. Migraciones
> v0.3.0: la migración `000006_add_auth_version_to_users` cierra **todas** las sesiones existentes una vez (esperado; avisar en las notas de versión). `000008` siembra los planes con precios de referencia.

```bash
php soraq-backend/bin/migrate.php --status
php soraq-backend/bin/migrate.php
```
Sin SSH: importar cada `.sql` pendiente en phpMyAdmin **en orden** e insertar su versión en `schema_migrations`.

### 5. Deploy
1. Subir `soraq-backend/` (sin `public/`).
2. Subir `backend/public/*` → `public_html/api/`.
3. Subir `frontend/dist/*` → `public_html/` (reemplazo completo de `assets/`).

### 6. Smoke testing (producción)
- [ ] `GET https://soraq.app/api/health` → `{"data":{"status":"ok"}}`.
- [ ] `https://soraq.app/` carga, sin errores de consola; `https://soraq.app/ruta-inexistente` muestra la 404.
- [ ] `https://soraq.app/api/../soraq-backend/.env` y variantes → no accesibles.
- [ ] Registro de una cuenta de prueba, login, crear proyecto, logout. Eliminar la cuenta de prueba.
- [ ] Headers: HSTS, CSP, X-Frame-Options presentes (DevTools → Network).
- [ ] `robots.txt` y `sitemap.xml` accesibles.
- [ ] Errores del API en español (`Content-Language: es`).
- [ ] Overlays de HeroUI (diálogo, menú de cuenta, drawer) funcionan con la CSP activa (sin errores CSP en consola).
- [ ] Modo claro/oscuro persiste al recargar.
- (No ejecutar `api-smoke.sh` contra producción: crea usuarios.)

### 7. Security review post-deploy
- Revisar `soraq-backend/storage/logs/` por errores nuevos.
- Confirmar que la cookie de sesión es `__Host-soraq_sid; Secure; HttpOnly; SameSite=Lax`.

## 4. Rollback

| Situación | Acción |
|---|---|
| Frontend roto, API ok | Restaurar la copia previa de `public_html/` (excepto `api/` si no cambió) |
| API rota sin migraciones nuevas | Restaurar `soraq-backend/` y `public_html/api/` previos |
| Migración aplicada con problemas | 1) Poner la app en modo mantenimiento (página estática), 2) restaurar DB desde el `mysqldump` previo, 3) restaurar código previo, 4) documentar incidente |

Por eso las migraciones destructivas se hacen en dos fases ([DATABASE.md](DATABASE.md#2-migraciones)): el código anterior sigue funcionando con el esquema nuevo.

## 5. Git: ramas, commits y releases

Detalle en [WORKFLOW.md](WORKFLOW.md#5-git).
