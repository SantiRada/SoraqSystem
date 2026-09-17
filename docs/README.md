# Documentación de Soraq

> La documentación es parte del código. Si cambia el comportamiento, cambia la documentación en el mismo cambio.

| Documento | Leer cuando… |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Necesitás entender qué es Soraq, para quién, pricing, roadmap |
| [GUIDELINES.md](GUIDELINES.md) | Diseñás o construís cualquier interfaz |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Vas a escribir código: dónde va cada cosa y por qué |
| [BRAND.md](BRAND.md) | Escribís textos, usás el logo, colores o tipografía |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | Tocás auth, permisos, datos, APIs, routing o vas a desplegar |
| [DATABASE.md](DATABASE.md) | Creás o modificás tablas |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vas a publicar en producción o hacer rollback |
| [WORKFLOW.md](WORKFLOW.md) | Siempre: flujo de trabajo, modificación segura, git, ADRs |
| [TESTING.md](TESTING.md) | Verificás un cambio o agregás tests |
| [SEO.md](SEO.md) | Agregás páginas públicas o metadatos |
| [I18N.md](I18N.md) | Escribís textos visibles o mensajes del API, o agregás un idioma |
| [NAVIGATION.md](NAVIGATION.md) | Tocás la navegación del proyecto o montás un módulo (fuente: `/_SITEMAP.md`) |
| [decisions/](decisions/) | Querés saber por qué se decidió algo (ADRs) |
| [modules/](modules/) | Trabajás en un módulo específico |
| [audits/](audits/) | Revisás auditorías anteriores (se generan con la skill `/auditoria`) |

## Ruta para una tarea nueva (ej. "Agregar Card Sorting")
1. PRODUCT → ¿qué contexto consume y produce?
2. NAVIGATION → dónde vive en el sitemap (Planear → Navegación → Arquitectura).
3. ARCHITECTURE §16 → pasos para un módulo nuevo.
4. modules/projects.md + modules/workspace.md → patrones de referencia.
5. GUIDELINES + I18N → componentes, estados, accesibilidad, textos.
6. SECURITY_AUDIT → reglas de seguridad al escribir el código (la auditoría completa se lanza luego con `/auditoria`).
7. WORKFLOW → verificación, CHANGELOG, ADR si cambia una decisión.
