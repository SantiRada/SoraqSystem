# 0002 — Backend PHP sin framework, monolito modular

| | |
|---|---|
| Estado | Aceptada |
| Fecha | 2026-09-16 |

## Contexto
El backend debe correr en Hostinger compartido, ser fácil de desplegar, seguro y permitir modificar un módulo sin tocar otros.

## Decisión
- PHP 8.2+ sin framework ni Composer en runtime. Autoloader PSR-4 propio.
- `Core/` (infraestructura) + `Modules/<X>/` (un directorio por módulo con routes, controller, service, policy, repository, entidades).
- Módulos habilitados en `config/modules.php`; cada módulo se cablea en su `routes.php`.
- Core nunca depende de Modules.

## Alternativas consideradas
| Alternativa | Por qué no |
|---|---|
| Laravel | Excelente, pero pesado para el alcance actual; deploy con Composer/artisan en hosting compartido agrega fricción |
| Slim + Composer | Menos código propio, pero agrega dependencias y un paso de build para funcionalidades que hoy son ~1000 líneas auditables |
| Microservicios | Sobreconstrucción |

## Consecuencias
- ✔ Superficie de ataque mínima, deploy trivial, código completamente auditable.
- ✘ Mantenemos nosotros router, validación, sesiones. **Revisar esta decisión** (nuevo ADR) si: el núcleo supera ~3000 líneas, se necesitan colas/jobs, ORM, o múltiples desarrolladores backend.
