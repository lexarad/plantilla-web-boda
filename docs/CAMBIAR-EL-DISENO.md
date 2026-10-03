# Cambiar el diseño de la web de invitados

La web de invitados viene con un diseño mínimo a propósito: tipografía del sistema, fondo blanco y un único color de acento. La idea es que pongas el tuyo encima. Puedes hacerlo de tres maneras, de menos a más trabajo.

## Nivel 1: colores y tipografía

- **Colores**: `src/styles/tokens.css`, bloque `[data-theme="base"]`. Las variables usan formato HSL (`tono saturación% luminosidad%`). Las importantes:
  - `--primary`: botones, enlaces destacados y acentos.
  - `--background` / `--foreground`: fondo y texto.
  - `--muted-foreground`: texto secundario.
  - `--border`: líneas y bordes.
- **Tipografía**: carga la fuente con `next/font/google` en `src/app/layout.tsx`, ponle `variable: "--font-display"` (o `--font-sans`) y añade su clase al `<html>`. Las variables por defecto están en `src/app/globals.css` (`:root`).

  ```tsx
  import { Playfair_Display } from "next/font/google";
  const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
  // <html className={display.variable} ...>
  ```

  Los títulos usan la clase `font-display` y el resto `font-sans`.

## Nivel 2: rehacer las páginas con Tailwind

Cada página es un archivo pequeño en `src/app/(public)/[lang]/`:

| Ruta | Archivo | Qué muestra |
|---|---|---|
| `/es` | `page.tsx` | Portada |
| `/es/agenda` | `agenda/page.tsx` | Programa del día |
| `/es/informacion` | `informacion/page.tsx` | Preguntas frecuentes, alojamiento, contacto |
| `/es/mapa` | `mapa/page.tsx` | Mapa y transporte |
| `/es/regalo` | `regalo/page.tsx` | IBAN |
| `/es/rsvp` | `rsvp/page.tsx` | Introducir el código de invitación |
| `/es/rsvp/<código>` | `rsvp/[token]/page.tsx` | Página personal del invitado y formulario |

La carcasa común (cabecera, pie) está en `src/app/(public)/[lang]/layout.tsx` y las piezas en `src/components/publico/`. Cambia el marcado y las clases como quieras: los datos ya llegan resueltos.

## Nivel 3: usar otra plantilla o librería de componentes

Si has encontrado una plantilla de boda que te gusta (HTML/Tailwind, shadcn/ui, una de Vercel…), puedes traerte su diseño y conectarlo a los datos. Esto es lo que necesitas saber.

### Los datos que puedes pintar

```ts
import { nombresPareja, pareja, programa, preguntas, textos } from "@/config/boda";
import { getWeddingDetails } from "@/lib/wedding-details";

const d = getWeddingDetails("es");
d.dateLabel        // "Sábado, 18 de septiembre de 2027"
d.ceremonyTime     // "17:00"
d.venueName        // "Finca de ejemplo"
d.venueMapQuery    // dirección para mapas
d.busEnabled       // si hay autobús
d.rsvpDeadline     // "31 de julio de 2027"
// …ver el tipo Details en src/lib/wedding-details.ts
```

Datos privados (IBAN, contacto, hoteles), en el servidor:

```ts
import { getWeddingSettings } from "@/lib/data";
const settings = await getWeddingSettings(); // iban, ibanHolder, ibanConcept, contactPhone, contactEmail, hotelSuggestions
```

### El RSVP: lo único que no conviene reinventar

El formulario de confirmación habla con la base de datos a través de **server actions** que ya validan, gestionan errores y protegen la edición:

- `openRsvpAccessAction` (`rsvp/actions.ts`): recibe `code` y `lang` y redirige a la página personal.
- `updateRsvpAction` (`rsvp/[token]/actions.ts`): guarda la respuesta. Campos del formulario:

| Campo | Valores |
|---|---|
| `token` | el código de la URL |
| `lang` | `es` / `ca` |
| `confirmacion_asistencia` | `confirmado` / `rechazado` |
| `menu_elegido` | `adulto`, `vegetariano`, `vegano`, `sin_gluten`, `sin_lactosa`, `infantil`, `especial` |
| `alergias_intolerancias` | texto (opcional) |
| `necesita_autobus` | casilla (`on` si está marcada) |
| `hotel_alojamiento` | texto (opcional) |
| `comentarios` | texto (opcional) |
| `cancion_sugerida` | texto (opcional) |

- `unlockRsvpEditAction`: pide `token` + `apellidos` para volver a editar una respuesta ya enviada.

`src/components/publico/formulario-rsvp.tsx` es un ejemplo completo con controles nativos: cópialo y cambia el aspecto, o sustitúyelo por tus componentes manteniendo los mismos `name`.

Para añadir otro valor de menú hay que tocarlo en todos estos sitios: la restricción `menu_elegido` de `supabase/schema.sql`, `src/lib/schemas.ts`, `src/lib/rsvp-options.ts`, `src/lib/rsvp-validation.ts` y la lista `MENUS` de `src/components/publico/formulario-rsvp.tsx`.

### Añadir una página nueva

1. Crea `src/app/(public)/[lang]/<nombre>/page.tsx` (copia `informacion/page.tsx` como punto de partida).
2. Añade la ruta a `rutasPublicas` y, si quieres, a `menuPublico` en `src/lib/textos-web.ts`, con su texto en `menu`.
3. Añade `<nombre>` a `RUTAS_PUBLICAS` y al `matcher` de `src/middleware.ts`, para que `/<nombre>` sin idioma redirija.

## Comprobar que no se ha roto nada

```bash
npm run typecheck && npm test && npm run build
npm run e2e        # recorre la web como un invitado y mide accesibilidad
```

Las pruebas de `e2e/` buscan textos como "Confirmar asistencia" o "Enviar respuesta". Si los cambias, actualiza también las pruebas.
