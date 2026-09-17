# Soraq — Base de datos

> Última revisión: 2026-09-17 · Esquema: 8 migraciones

## 1. Principios

| Regla | Detalle |
|---|---|
| Motor | InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`. Compatible MySQL 8 y MariaDB 10.4+ (Hostinger) |
| Tiempo | Todo en **UTC** (`SET time_zone = '+00:00'` al conectar). Nada de fechas locales en DB |
| Identificadores | `id BIGINT UNSIGNED AUTO_INCREMENT` interno + `public_id CHAR(26)` ULID para el API/URLs |
| Acceso | Solo repositorios, solo `PDO` con prepared statements reales (`EMULATE_PREPARES=false`) |
| Modo SQL | `STRICT_ALL_TABLES` (sin truncados silenciosos) |
| Scope | Toda consulta de datos de usuario incluye el scope de acceso en el `WHERE` |
| Dinero (futuro) | `amount_minor BIGINT` + `currency CHAR(3)` (ISO 4217). Nunca `FLOAT`/`DECIMAL` sin moneda |
| Estados | `VARCHAR(20)` validado en código (no `ENUM`: agregar un estado no requiere `ALTER`) |
| Borrado | Hard delete por defecto. Soft delete solo con justificación en la ficha del módulo |
| Usuario DB | Privilegios mínimos sobre **una** base (sin `GRANT`, sin acceso a otras bases) |

## 2. Migraciones

- Archivos `database/migrations/YYYY_MM_DD_NNNNNN_descripcion.sql`, aplicados en orden por `php bin/migrate.php`.
- Registro en `schema_migrations(version, applied_at)`.
- **Forward-only**: nunca editar una migración ya aplicada en cualquier entorno → crear una nueva.
- MySQL no hace DDL transaccional: una migración = un cambio coherente y pequeño.
- Cambios destructivos (DROP/renombrar columnas) en **dos fases**: 1) agregar lo nuevo + código compatible con ambos, 2) eliminar lo viejo en un release posterior.
- `php bin/migrate.php --status` muestra aplicadas/pendientes.

## 3. Entidades actuales (necesarias ahora)

### `users`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | Interno |
| public_id | CHAR(26) UNIQUE | ULID expuesto |
| email | VARCHAR(254) UNIQUE | Normalizado (trim + minúsculas) |
| password_hash | VARCHAR(255) | Argon2id. Nunca sale del backend |
| display_name | VARCHAR(100) | |
| locale | VARCHAR(35) | BCP 47, default `es` (migración 000005) |
| timezone | VARCHAR(64) | IANA, default `UTC` |
| status | VARCHAR(20) | `active` (futuro: `suspended`, `pending_verification`) |
| role | VARCHAR(20) | `user` (default) o `admin`. Solo administración de plataforma; nunca bypass de ownership (ADR 0009). No modificable vía API |
| last_login_at | DATETIME NULL | |
| created_at / updated_at | DATETIME | UTC |

### `projects`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| public_id | CHAR(26) UNIQUE | |
| owner_user_id | BIGINT UNSIGNED FK → users.id | `ON DELETE CASCADE`. Índice `(owner_user_id, updated_at)` |
| name | VARCHAR(120) | |
| description | VARCHAR(2000) NULL | |
| created_at / updated_at | DATETIME | |

### `project_members` (000007)
| Columna | Tipo | Notas |
|---|---|---|
| project_id | FK → projects.id | `ON DELETE CASCADE` |
| user_id | FK → users.id | `ON DELETE CASCADE`. Único por `(project_id, user_id)` |
| role | VARCHAR(20) | `editor` o `viewer` (el owner nunca es membresía) |
| added_by_user_id | FK → users.id NULL | `ON DELETE SET NULL` |
| created_at / updated_at | DATETIME | |

### Card Sorting (000010)
| Tabla | Columnas clave | Notas |
|---|---|---|
| `card_sorts` | `public_id`, `project_id` (CASCADE), `name`, `status` (draft/active/paused/closed), `sort_type` (open/hybrid/closed), `content` JSON, `settings` JSON, `share_code` único, `project_slug`, `published_at`, `closed_at` | Documento validado por `CardSortContent` ([ADR 0015](decisions/0015-card-sorting-studies.md)) |
| `card_sort_responses` | `card_sort_id` (CASCADE), `token_hash` único, `participant_number`, `status` (in_progress/completed/screened_out), `snapshot`, `screening_answers`, `post_answers`, `sort_result`, `started_at`, `finished_at`, `duration_seconds` | Anónimas: sin IP ni datos personales |
| `card_sort_viewers` | `card_sort_id` (CASCADE), `user_id` (CASCADE), `added_by_user_id` (SET NULL) | Lectura del estudio sin acceso al proyecto |

Retención: las respuestas viven mientras exista el estudio; "Eliminar resultados" las borra definitivamente. Respuestas `in_progress` abandonadas: purga pendiente (pre-lanzamiento).

### `product_notes` (000009)
| Columna | Tipo | Notas |
|---|---|---|
| public_id | CHAR(26) ULID | Único; único id expuesto |
| project_id | FK → projects.id | `ON DELETE CASCADE` |
| author_user_id | FK → users.id NULL | `ON DELETE SET NULL` |
| title | VARCHAR(120) | |
| body | TEXT | Máx. 5000 caracteres (validado en el API) |
| created_at / updated_at | DATETIME | |

### `project_context_prompts` (000009)
Una fila por proyecto con el último resumen IA de sus notas: `summary` (MEDIUMTEXT), `source_hash` (sha256 de las notas resumidas; distinto ⇒ desactualizado), `note_count`, `model`, `generated_by_user_id` (`SET NULL`), `generated_at`. `ON DELETE CASCADE` con el proyecto. El texto se envía a Groq al generarlo ([ADR 0013](decisions/0013-ai-provider-groq-context-prompt.md)).

### Facturación (000008) — modelo de lectura, sin proveedor todavía
| Tabla | Columnas clave | Notas |
|---|---|---|
| `plans` | `code` único, `billing_interval` (`month`/`year`), `amount_minor`, `currency`, `requires_code`, `is_active`, `sort_order` | Sembrada: standard 4000 USD/mes, annual 36000 USD/año, education 1200 USD/mes (requiere código) |
| `subscriptions` | `user_id` único, `plan_id`, `status` (`active`, `trialing`, `past_due`, `canceled`), `current_period_start/end`, `cancel_at_period_end`, `provider`, `provider_reference` | `ON DELETE CASCADE` con el usuario |
| `payments` | `public_id`, `user_id` NULL, `plan_id`, `amount_minor`, `currency`, `status` (`paid`, `pending`, `failed`, `refunded`), `paid_at`, `provider`, `provider_reference` | `user_id ON DELETE SET NULL`: el historial contable se conserva |

`users.auth_version` (000006): contador para invalidar sesiones al cambiar la contraseña.

### `audit_logs`
Append-only. Sin FK a `users` a propósito (el rastro sobrevive al borrado de cuentas).
`occurred_at DATETIME(3)`, `actor_user_id`, `action`, `target_type`, `target_id`, `ip_address`, `user_agent`, `request_id`, `metadata` (JSON en TEXT). Índices por actor, acción y target.

### `rate_limits`
`key_hash CHAR(64) PK` (SHA-256 de la clave; no guarda emails/IPs en claro), `attempts`, `reset_at`. Ventana fija.

### `schema_migrations`
Creada por el runner.

### Diagrama actual

```
users 1 ──── * projects 1 ──── * project_members * ──── 1 users
users 1 ──── 0..1 subscriptions * ──── 1 plans
users 1 ──── * payments (user_id SET NULL al borrar)
  ·
  · (sin FK)
audit_logs.actor_user_id

rate_limits (independiente)
```

## 4. Entidades futuras (NO implementadas)

Documentadas para que las decisiones actuales no las bloqueen. **No crear estas tablas hasta que un módulo las necesite** (con su ficha y ADR si aplica).

### Equipos y permisos
| Tabla | Propósito | Notas de diseño |
|---|---|---|
| `workspaces` | Espacio de trabajo (personal o de equipo) | Al introducirlo: migración que crea un workspace personal por usuario y agrega `projects.workspace_id` |
| `workspace_members` | Usuario ↔ workspace con `role` | Roles iniciales: `owner`, `admin`, `editor`, `viewer`. Permisos derivados del rol en Policies |
| `organizations` | Facturación/SSO de empresas | Solo si aparece necesidad enterprise |
| `roles` / `permissions` | Tablas dinámicas de RBAC | **Evitar** hasta que roles fijos no alcancen |

### Estudios (Validate)
| Tabla | Propósito |
|---|---|
| `studies` | Estudio de un proyecto: `type` (`survey`, `tree_test`, `card_sort`…), `status` (`draft`, `live`, `closed`), config JSON versionada |
| `study_participants` | Participante anónimo/identificado: token de acceso propio (no sesión de usuario), consentimiento, metadata mínima |
| `study_responses` / `study_results` | Respuestas crudas y agregados. Particionables por `study_id` |

Seguridad prevista: los participantes acceden por **token de estudio** con alcance a un único estudio; nunca a datos del proyecto.

### Billing, creators y education
| Tabla | Propósito |
|---|---|
| ~~`plans`, `subscriptions`~~ | **Implementadas en 000008** (ver §3). Pendiente: límites por plan (JSON) y suscripción por workspace |
| `discount_codes` | `code`, `kind` (`creator`, `education`, `promo`), % o monto, `max_redemptions`, `expires_at`, `institution` |
| `creator_profiles` | Creador, datos de pago (en el proveedor, no aquí), % comisión |
| `referrals` | Atribución: `creator_id`, `referred_user_id`, `discount_code_id`, `first_paid_at` |
| `commissions` | Comisión por periodo pagado (`amount_minor`, `currency`, `status`) |
| `usage_records` | Consumo medido: `metric` (`ai_credits`, `participants`, `storage_bytes`), `quantity`, `period` |
| `education_verifications` | Estado de verificación de estudiante, método, expiración |

### Contenido y archivos
| Tabla | Propósito |
|---|---|
| `files` | Metadatos de archivos subidos: `storage_key` aleatorio, `mime`, `size`, `sha256`, scope (proyecto). Binarios fuera del web root o en object storage |
| `project_context_entries` | Núcleo de contexto reutilizable (problema, usuarios, hipótesis…) — diseño en etapa 1 |
| `ai_workflows` / `resources` / `prompts` | Recursos de IA versionados y contextualizados |

## 5. Retención (a definir antes de producción con datos reales)

| Datos | Propuesta |
|---|---|
| `audit_logs` | 12 meses, luego purga/archivado |
| `rate_limits` | Purga de filas con `reset_at` vencido (tarea programada) |
| Sesiones (archivos) | GC de PHP según `SESSION_ABSOLUTE_TIMEOUT` |
| Cuenta eliminada | Borrado en cascada de proyectos; audit logs conservan solo ids |

## 6. Backups

- Producción: backup automático de Hostinger **+** `mysqldump` manual antes de cada migración (ver [DEPLOYMENT.md](DEPLOYMENT.md)).
- Nunca commitear dumps (`.gitignore`).
