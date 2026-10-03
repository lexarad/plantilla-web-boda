import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { unlockRsvpEditAction, updateRsvpAction } from "@/app/(public)/[lang]/rsvp/[token]/actions";
import { nombresPareja, type WeddingLocale } from "@/config/boda";
import { AddToCalendar } from "@/components/add-to-calendar";
import { FormularioRsvp } from "@/components/publico/formulario-rsvp";
import { Bloque, ListaDatos, Pagina } from "@/components/publico/pagina";
import { RsvpEditGate } from "@/components/rsvp-edit-gate";
import { RsvpTracker } from "@/components/rsvp-tracker";
import { Button } from "@/components/ui/button";
import { getRsvpExtras, getRsvpGuestResult } from "@/lib/data";
import { resolveLocale } from "@/lib/locale";
import { rsvpEditCookieName } from "@/lib/rsvp-edit-cookie";
import { rutaPublica, textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

export const metadata: Metadata = {
  robots: { index: false }
};

const copy: Record<
  WeddingLocale,
  {
    hola: (nombre: string) => string;
    intro: string;
    tuRespuesta: string;
    cambiar: string;
    gracias: string;
    graciasNo: string;
    noEncontrado: string;
    noEncontradoTexto: string;
    caido: string;
    caidoTexto: string;
    volver: string;
    estado: string;
    mesa: string;
    autobus: string;
    estados: Record<"pendiente" | "confirmado" | "rechazado", string>;
  }
> = {
  es: {
    hola: (nombre) => `Hola, ${nombre}`,
    intro: "Cuéntanos si vienes y lo que necesitemos saber para organizarlo todo.",
    tuRespuesta: "Tu respuesta",
    cambiar: "Puedes cambiarla cuando quieras desde este mismo enlace.",
    gracias: "¡Gracias! Hemos guardado tu respuesta.",
    graciasNo: "Gracias por avisarnos. Hemos guardado tu respuesta.",
    noEncontrado: "No encontramos esta invitación",
    noEncontradoTexto: "Revisa el enlace o escribe tu código de invitación.",
    caido: "Ahora mismo no podemos cargar tu invitación",
    caidoTexto: "Tu enlace es correcto: el problema es nuestro y suele durar pocos minutos. Vuelve a abrirlo dentro de un rato.",
    volver: "Introducir código",
    estado: "Estado",
    mesa: "Tu mesa",
    autobus: "Tu autobús",
    estados: { pendiente: "Sin responder", confirmado: "Vienes", rechazado: "No vienes" }
  },
  ca: {
    hola: (nombre) => `Hola, ${nombre}`,
    intro: "Explica'ns si vens i el que necessitem saber per organitzar-ho tot.",
    tuRespuesta: "La teva resposta",
    cambiar: "La pots canviar quan vulguis des d'aquest mateix enllaç.",
    gracias: "Gràcies! Hem desat la teva resposta.",
    graciasNo: "Gràcies per avisar-nos. Hem desat la teva resposta.",
    noEncontrado: "No trobem aquesta invitació",
    noEncontradoTexto: "Revisa l'enllaç o escriu el teu codi d'invitació.",
    caido: "Ara mateix no podem carregar la teva invitació",
    caidoTexto: "El teu enllaç és correcte: el problema és nostre i sol durar pocs minuts. Torna-hi d'aquí a una estona.",
    volver: "Introduir codi",
    estado: "Estat",
    mesa: "La teva taula",
    autobus: "El teu autobús",
    estados: { pendiente: "Sense resposta", confirmado: "Vens", rechazado: "No vens" }
  }
};

export default async function RsvpPage({
  params,
  searchParams
}: {
  params: Promise<{ lang: string; token: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { lang, token } = await params;
  const query = await searchParams;
  const locale = resolveLocale(lang);
  const t = copy[locale];
  const tw = textosWeb[locale];
  const d = getWeddingDetails(locale);
  const [{ guest, unavailable }, extras] = await Promise.all([getRsvpGuestResult(token), getRsvpExtras(token)]);

  // La base de datos no responde: NO decirle al invitado que su enlace no vale.
  if (unavailable || !guest) {
    return (
      <Pagina
        titulo={unavailable ? t.caido : t.noEncontrado}
        intro={unavailable ? t.caidoTexto : t.noEncontradoTexto}
        locale={locale}
      >
        <Button asChild variant="outline" className="rounded-md">
          <Link href={rutaPublica(locale, "rsvp")}>{t.volver}</Link>
        </Button>
      </Pagina>
    );
  }

  // Quien ya respondió confirma su apellido para volver a editar, salvo justo
  // después de guardar (acaba de demostrar que es él quien edita).
  const cookieStore = await cookies();
  const edicionDesbloqueada = cookieStore.get(rsvpEditCookieName(token))?.value === "1" || query.ok === "1";
  const yaRespondio = guest.confirmacion_asistencia !== "pendiente";
  const necesitaDesbloquear = yaRespondio && !edicionDesbloqueada;
  const recienGuardado = query.ok === "1";

  return (
    <Pagina titulo={t.hola(guest.nombre)} intro={t.intro} locale={locale}>
      <RsvpTracker token={token} locale={locale} />

      {recienGuardado ? (
        <div role="status" className="space-y-4 rounded-md border border-primary/40 bg-primary/5 p-4">
          <p className="font-medium">
            {guest.confirmacion_asistencia === "rechazado" ? t.graciasNo : t.gracias}
          </p>
          {guest.confirmacion_asistencia === "confirmado" ? (
            <AddToCalendar
              title={nombresPareja}
              description={`${d.venueName}, ${d.venueLocation}`}
              location={`${d.venueName}, ${d.venueMapQuery}`}
              startIso={d.eventDateTimeIso}
              endIso={d.eventEndIso}
              locale={locale}
            />
          ) : null}
        </div>
      ) : null}

      <ListaDatos
        items={[
          { etiqueta: tw.inicio.fecha, valor: d.dateLabel },
          { etiqueta: tw.inicio.hora, valor: d.ceremonyTime },
          { etiqueta: tw.inicio.lugar, valor: `${d.venueName} · ${d.venueLocation}` },
          { etiqueta: tw.inicio.confirmarAntes, valor: d.rsvpDeadline },
          { etiqueta: t.estado, valor: t.estados[guest.confirmacion_asistencia] },
          // Mesa y autobús solo cuando ya están asignados desde el panel.
          ...(guest.confirmacion_asistencia === "confirmado" && extras?.mesa_nombre
            ? [{ etiqueta: t.mesa, valor: extras.mesa_nombre }]
            : []),
          ...(guest.confirmacion_asistencia === "confirmado" && extras?.bus_nombre
            ? [{ etiqueta: t.autobus, valor: [extras.bus_nombre, extras.bus_horarios].filter(Boolean).join(" · ") }]
            : [])
        ]}
      />

      <Bloque titulo={t.tuRespuesta}>
        <p className="text-sm text-muted-foreground">{t.cambiar}</p>
        {necesitaDesbloquear ? (
          <RsvpEditGate token={token} locale={locale} action={unlockRsvpEditAction} />
        ) : (
          <FormularioRsvp
            token={token}
            locale={locale}
            mostrarAutobus={d.busEnabled}
            action={updateRsvpAction}
            inicial={{
              confirmacion_asistencia: guest.confirmacion_asistencia,
              menu_elegido: guest.menu_elegido,
              alergias_intolerancias: guest.alergias_intolerancias,
              necesita_autobus: guest.necesita_autobus,
              hotel_alojamiento: guest.hotel_alojamiento,
              comentarios: guest.comentarios,
              cancion_sugerida: guest.cancion_sugerida ?? null
            }}
          />
        )}
      </Bloque>
    </Pagina>
  );
}
