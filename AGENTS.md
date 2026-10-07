# Web de boda

<!-- FUSION-SIN-REVISION 2026-10-07 -->
**Fusión sin revisión de Víctor (decisión del 07/10/2026):** Víctor no revisa ni aprueba PR. Claude fusiona su trabajo cuando se cumplen tres condiciones: el gate del repo está en verde; la revisión automática no deja hallazgos bloqueantes ni importantes (en lo sensible, con revisión de seguridad y adversarial); no hay conflictos. Solo esperan a Víctor las acciones que únicamente su cuenta puede hacer, las decisiones de rumbo y las operaciones ⛔.
PR de terceros (socios, colaboradores): los revisa y fusiona una sesión de Claude de Víctor, siempre con revisión de seguridad; nunca su autor ni una sesión que trabaje para él. También esperan a Víctor las decisiones legales o de negocio reservadas (textos legales, firmar como abogado, activar un país). ⛔ = comandos destructivos, credenciales o BD de producción, migraciones de producción fuera del despliegue normal y migraciones con pérdida de datos. Regla completa: `DIRECTION.md` de ai-control-plane, sección «Revisión y fusión».

Plantilla de web de boda: web de invitados (`src/app/(public)/[lang]`) + panel privado (`src/app/(admin)`).

Stack: Next.js App Router, TypeScript estricto, Tailwind CSS, Supabase (Auth/DB/Storage) y Vercel. Sin Supabase, la app arranca en modo demo (solo en local) con datos de `src/lib/demo-store.ts`.

## Dónde está cada cosa

- Datos de la boda: `src/config/boda.ts` (única fuente; no repetir nombres, fechas ni lugar en otros archivos).
- Textos fijos de la web de invitados: `src/lib/textos-web.ts` (castellano y catalán).
- Colores: `src/styles/tokens.css` (`[data-theme="base"]` web, `[data-theme="admin"]` panel).
- Acceso a datos: `src/lib/data.ts` (cada función tiene rama Supabase y rama demo).
- Base de datos: `supabase/schema.sql` (idempotente; cualquier cambio de esquema va ahí).
- Guías: `docs/PUESTA-EN-MARCHA.md` y `docs/CAMBIAR-EL-DISENO.md`.

## Reglas

- No introducir credenciales reales; documentar claves nuevas sin valor en `.env.example`.
- Los valores que guarda la base de datos (menús, estados, responsables) están restringidos en `supabase/schema.sql` y en `src/lib/schemas.ts`: cambiarlos en ambos.
- Tras cambios TypeScript: `npm run typecheck` y `npm test`. Antes de publicar: `npm run build` (y `npm run e2e` si cambia la web de invitados).
