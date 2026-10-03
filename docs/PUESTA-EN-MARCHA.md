# Puesta en marcha

Pasos para publicar la web con datos reales. Sigue el orden. Necesitas cuenta (gratis) en:

- **GitHub**: donde vive el código.
- **Supabase** (https://supabase.com): base de datos, login y archivos.
- **Vercel** (https://vercel.com): donde se publica la web.
- **Resend** (https://resend.com): solo si quieres enviar las invitaciones por correo desde el panel. Es opcional.

---

## 0) Antes de empezar

1. Pon vuestros datos en `src/config/boda.ts` (nombres, fecha, lugar...).
2. Sube el proyecto a un repositorio **privado** de GitHub.

## 1) Crear la base de datos en Supabase

1. En Supabase, crea un proyecto nuevo (región Europa) y espera a que esté listo.
2. Abre `supabase/schema.sql` y **cambia los dos emails** de la función `is_wedding_admin()` por los vuestros:
   ```sql
   'novio1@example.com',
   'novio2@example.com'
   ```
   Son los únicos que podrán entrar al panel. Deja las comillas y la coma como están.
3. En Supabase, abre **SQL Editor > New query**, pega **todo** el archivo y pulsa **Run**. Debe salir "Success".
   - Se puede volver a ejecutar más adelante sin romper nada (por ejemplo, si cambias los emails).
4. En **Authentication > URL Configuration**:
   - **Site URL**: la dirección de la web (de momento la de Vercel, p. ej. `https://tu-boda.vercel.app`).
   - **Redirect URLs**: añade `https://tu-boda.vercel.app/auth/callback` (y `http://localhost:3000/auth/callback` para probar en local).

> El SQL crea las tablas, las reglas de seguridad (solo los admins leen y escriben; el invitado solo ve y edita lo suyo con su código) y el almacén privado de documentos.

## 2) Publicar en Vercel

1. En Vercel: **Add New > Project**, importa el repositorio de GitHub y pulsa **Deploy**.
2. En **Settings > Environment Variables**, añade estas variables (entorno *Production*; puedes copiar la lista de `.env.example`):

| Variable | Valor | Dónde se consigue |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave `anon public` | Supabase > Project Settings > API |
| `ADMIN_EMAILS` | Los mismos emails del paso 1, separados por coma | — |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-boda.vercel.app` (o tu dominio) | La dirección de la web |
| `CRON_SECRET` | Una contraseña larga inventada | Protege el aviso diario a Supabase |
| `NEXT_PUBLIC_WEDDING_IBAN` | IBAN para regalos (opcional) | Tu banco |
| `NEXT_PUBLIC_WEDDING_IBAN_HOLDER` | Titular de la cuenta | Tu banco |
| `NEXT_PUBLIC_WEDDING_IBAN_CONCEPT` | Concepto sugerido | Lo decides tú |
| `NEXT_PUBLIC_WEDDING_PHONE` | Teléfono de contacto (opcional) | — |
| `NEXT_PUBLIC_WEDDING_EMAIL` | Email de contacto (opcional) | — |
| `NEXT_PUBLIC_WEDDING_HOTELS` | Hoteles sugeridos (texto libre, opcional) | — |
| `RESEND_API_KEY` | Clave de Resend (opcional) | Resend > API Keys |
| `RESEND_FROM_EMAIL` | Remitente, p. ej. `invitaciones@tudominio.es` | Ver paso 3 |

3. **Deployments >** último despliegue **> ⋯ > Redeploy**, para que coja las variables.
4. Comprueba:
   - `https://tu-boda.vercel.app/dashboard` te manda al login (el panel está protegido).
   - Entra con uno de los emails: te llega un enlace mágico al correo. Si no lo ves, mira en Spam.

> Las variables `NEXT_PUBLIC_*` se ven en el navegador: no pongas ahí nada secreto. El IBAN es público a propósito (sale en la página de regalo).

## 3) Correo de invitaciones con Resend (opcional)

Sin esto, todo funciona igual y puedes mandar los enlaces por WhatsApp desde el panel.

1. En Resend: **Domains > Add Domain** con tu dominio.
2. Copia los registros DNS (SPF/DKIM) en el panel de tu proveedor de dominio y espera a que salga **Verified**.
3. Usa un remitente de ese dominio en `RESEND_FROM_EMAIL` y vuelve a desplegar.

Sin dominio propio, Resend solo deja enviar desde `onboarding@resend.dev` y únicamente a tu propio email (sirve para probar).

## 4) Dominio propio (opcional, de pago)

1. Compra el dominio y añádelo en Vercel: **Settings > Domains > Add**.
2. Pon en tu proveedor los registros DNS que indique Vercel.
3. Cambia `NEXT_PUBLIC_SITE_URL` y la **Site URL / Redirect URLs** de Supabase al dominio nuevo, y vuelve a desplegar.

## 5) Extras de GitHub (opcionales)

En `.github/workflows/` hay tres automatismos. Sin configurar no hacen nada malo:

- **Verificación**: en cada push comprueba tipos, tests, lint, build y pruebas de navegador.
- **Vigilante** (`salud.yml`): cada 6 horas comprueba que la web y la base de datos responden. Actívalo con la variable `SITE_URL` y el secreto `CRON_SECRET` en *Settings > Secrets and variables > Actions*.
- **Copia de seguridad semanal** (`copia-seguridad.yml`): vuelca todos los datos a un JSON. Necesita los secretos `SUPABASE_ACCESS_TOKEN` (Supabase > Account > Access Tokens) y `PROJECT_REF` (el identificador del proyecto, en su URL). Opcionalmente, `MAIL_USUARIO`, `MAIL_CLAVE` y `MAIL_DESTINO` para recibirla por correo.

Además, `vercel.json` programa una llamada diaria a `/api/cron/keepalive` para que Supabase (plan gratuito) no pause el proyecto por inactividad.

---

## Lista final

- [ ] `src/config/boda.ts` con vuestros datos.
- [ ] `supabase/schema.sql` ejecutado con vuestros emails ("Success").
- [ ] Site URL y Redirect URLs puestas en Supabase.
- [ ] Variables en Vercel y **Redeploy** hecho.
- [ ] `/dashboard` pide login y podéis entrar con vuestros emails.
- [ ] Importados los invitados (Panel > Invitados > Importar CSV) y probado un RSVP con un código real.
