# Web de boda

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
