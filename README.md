# Soraq

**El espacio de trabajo UX para diseñar con IA.** Soraq connects the whole UX process — plan, design, test, deliver — in one project context. The product UI is natively in Spanish.

> ⚠️ This repository is the **new version** under development on localhost. The live site at https://soraq.app must not be modified until this version is finished and validated ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

- Product, architecture, brand, security: **[docs/](docs/README.md)** (Spanish)
- Changes: [CHANGELOG.md](CHANGELOG.md)

## Stack

React 19 + TypeScript + Vite + HeroUI v3 / Tailwind CSS v4 (frontend) · PHP 8.2 + MySQL/MariaDB (backend) · Apache (XAMPP locally, Hostinger in production). Rationale: [docs/ARCHITECTURE.md §2](docs/ARCHITECTURE.md#2-stack-y-decisiones).

## Local setup (Windows + XAMPP)

Requirements: XAMPP (Apache, PHP ≥ 8.2, MariaDB/MySQL), Node.js ≥ 20.19, Git Bash (for the smoke test).

1. **Start Apache and MySQL** from the XAMPP Control Panel. The project must live at `C:\xampp\htdocs\SoraqSystem`.

2. **Create the local database and a least-privilege user** (phpMyAdmin → SQL, or `C:\xampp\mysql\bin\mysql.exe -uroot`):
   ```sql
   CREATE DATABASE soraq_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'soraq_local'@'localhost' IDENTIFIED BY 'choose-a-local-password';
   CREATE USER 'soraq_local'@'127.0.0.1' IDENTIFIED BY 'choose-a-local-password';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON soraq_local.* TO 'soraq_local'@'localhost';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON soraq_local.* TO 'soraq_local'@'127.0.0.1';
   ```

3. **Configure the backend**: copy `backend/.env.example` → `backend/.env` and set `DB_PASSWORD`.

4. **Run migrations**:
   ```bash
   C:\xampp\php\php.exe backend\bin\migrate.php
   ```

5. **Create the local debug account** (admin, development only):
   ```bash
   C:\xampp\php\php.exe backend\bin\seed-debug-user.php
   ```
   Sign in with `debug@debug.com` / `debug1234`.

6. **Install and run the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173. API calls to `/api/*` are proxied to `http://localhost/SoraqSystem/backend/public/*`.

7. **Verify**:
   ```bash
   bash backend/tests/smoke/api-smoke.sh --reset-rate-limits
   ```
   (`--reset-rate-limits` clears the local rate-limit table so the test can be re-run; registration is limited to 5/hour per IP.)

## Scripts (frontend)

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with API proxy |
| `npm run build` | Typecheck + production build to `frontend/dist` |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint (incl. accessibility rules) |
| `npm run preview` | Serve the production build locally (no API proxy) |

## Project layout

```
docs/       Product, guidelines, architecture, brand, security, ADRs, module specs, audits
frontend/   React SPA (app · config · design-system · shared · features)
backend/    PHP API (public · config · src/Core · src/Modules · database/migrations · bin · storage · tests)
```

Before changing anything, read [docs/WORKFLOW.md](docs/WORKFLOW.md) — especially the **safe modification rule**.
