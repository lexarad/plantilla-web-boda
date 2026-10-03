# Web de boda: plantilla

Esqueleto de una web de boda con dos partes:

- **Web de invitados** (`/es`): portada, programa, información, cómo llegar, regalo y confirmación de asistencia (RSVP) con enlace o código personal y QR. El diseño es **deliberadamente neutro** para que lo cambies por el tuyo.
- **Panel privado** (`/dashboard`): invitados, grupos, mesas y plano, autobuses, catering y alergias, canciones, cronograma, proveedores, documentos, tareas, presupuesto y ajustes. Solo entran los emails autorizados.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase (base de datos, login y archivos) + Vercel. Correos con Resend (opcional).

## Probarla en tu ordenador (sin configurar nada)

Necesitas [Node.js 22](https://nodejs.org).

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin Supabase, la app arranca en **modo demo**: el panel está abierto con datos de ejemplo (guardados en un archivo temporal de tu ordenador) y puedes probar el RSVP con el código `K7N4Q` (apellido `Garcia`) o `R8P2M`. El modo demo **solo funciona en local**: en producción sin Supabase el panel queda cerrado.

## Ponerla a vuestro nombre

1. **Datos de la boda**: edita [`src/config/boda.ts`](src/config/boda.ts). Nombres, fecha, lugar, horario, autobús, textos, programa del día, preguntas frecuentes y los mensajes de WhatsApp y correo que se envían desde el panel. Todo lo demás (web, panel, correos, QR, imagen para compartir) lee de ahí.
2. **Datos privados** (IBAN, teléfono, email de contacto, hoteles): variables de entorno. Ver [`.env.example`](.env.example).
3. **Colores**: [`src/styles/tokens.css`](src/styles/tokens.css), bloque `[data-theme="base"]`. Con cambiar `--primary` ya cambia el acento de toda la web.
4. **Diseño completo**: ver [docs/CAMBIAR-EL-DISENO.md](docs/CAMBIAR-EL-DISENO.md).
5. **Publicarla** (Supabase + Vercel + Resend): ver [docs/PUESTA-EN-MARCHA.md](docs/PUESTA-EN-MARCHA.md).

## Idiomas

Sale en castellano. Los textos en catalán ya están escritos: para publicar la web en los dos idiomas, en `src/config/boda.ts` pon `idiomas = ["es", "ca"]` y aparece el selector de idioma. Los textos fijos de la web están en [`src/lib/textos-web.ts`](src/lib/textos-web.ts).

## Estructura

```
src/
  config/boda.ts            ← datos de la boda (empieza aquí)
  app/(public)/[lang]/      ← web de invitados (una carpeta por página)
  components/publico/       ← piezas de la web de invitados (cabecera, pie, formulario RSVP…)
  app/(admin)/              ← panel privado
  components/               ← componentes del panel y comunes
  lib/                      ← datos (data.ts), validación, correo, demo…
  styles/tokens.css         ← colores y temas
supabase/schema.sql         ← base de datos completa (se pega una vez en Supabase)
e2e/                        ← pruebas de extremo a extremo (Playwright)
.github/workflows/          ← verificación, copia de seguridad y vigilante (opcionales)
```

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Comprobar tipos |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run lint` | Lint |
| `npm run build` | Build de producción |
| `npm run e2e` | Pruebas de extremo a extremo (Playwright; la primera vez: `npx playwright install chromium`) |

## Seguridad y privacidad

- El panel solo abre con login por enlace mágico (Supabase Auth) para los emails de `ADMIN_EMAILS`, y la base de datos lo refuerza con RLS (`is_wedding_admin()` en `supabase/schema.sql`).
- El invitado accede con un código de 8 caracteres no adivinable. Para **cambiar** una respuesta ya enviada se le pide el apellido, por si el enlace se reenvía. Lo comprueba la base de datos: el apellido nunca se envía al navegador.
- La web de invitados solo habla con la base de datos a través de las funciones de la sección final de `supabase/schema.sql`, y cada una solo ve al invitado del enlace.
- Los enlaces personales (`/es/rsvp/<código>`) no se indexan en buscadores.
- No subas nunca `.env.local` ni claves reales al repositorio.
