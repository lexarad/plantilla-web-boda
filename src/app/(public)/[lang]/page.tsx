import Link from "next/link";
import { evento, nombresPareja, pareja, textos } from "@/config/boda";
import { CuentaAtras } from "@/components/publico/cuenta-atras";
import { Bloque, ListaDatos } from "@/components/publico/pagina";
import { Button } from "@/components/ui/button";
import { resolveLocale } from "@/lib/locale";
import { rutaPublica, textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

/** Datos estructurados del evento para buscadores (si la web es indexable). */
function EventJsonLd({ descripcion }: { descripcion: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${nombresPareja}`,
    startDate: evento.inicioIso,
    endDate: evento.finIso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: descripcion,
    location: {
      "@type": "Place",
      name: evento.lugar.nombre,
      address: { "@type": "PostalAddress", addressLocality: evento.lugar.ciudad, addressCountry: evento.lugar.pais }
    },
    organizer: [
      { "@type": "Person", name: pareja.uno },
      { "@type": "Person", name: pareja.dos }
    ]
  };

  return (
    <script
      type="application/ld+json"
      // JSON serializado en el servidor a partir de la configuración (sin datos del usuario).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Inicio({
  params,
  searchParams
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { lang } = await params;
  const { estado } = await searchParams;
  const locale = resolveLocale(lang);
  const d = getWeddingDetails(locale);
  const t = textosWeb[locale];
  const texto = textos[locale];

  const esencial = [
    { etiqueta: t.inicio.fecha, valor: d.dateLabel },
    { etiqueta: t.inicio.hora, valor: d.ceremonyTime },
    { etiqueta: t.inicio.lugar, valor: `${d.venueName} · ${d.venueLocation}` },
    ...(d.busEnabled ? [{ etiqueta: t.inicio.transporte, valor: d.transportCopy }] : []),
    { etiqueta: t.inicio.vestimenta, valor: d.dressCode },
    { etiqueta: t.inicio.confirmarAntes, valor: d.rsvpDeadline }
  ];

  return (
    <main id="main" lang={locale} className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <EventJsonLd descripcion={texto.descripcionSeo} />

      {estado === "en-preparacion" ? (
        <p role="status" className="mb-8 rounded-md border border-border bg-muted px-4 py-3 text-sm">
          {t.inicio.preparacion}
        </p>
      ) : null}

      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{texto.antetitulo}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl">{nombresPareja}</h1>
        <p className="mt-4 text-lg">
          {d.dateLabel} · {d.venueLocation}
        </p>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{texto.bienvenida}</p>
        <div className="mt-4">
          <CuentaAtras fechaIso={d.eventDateTimeIso} locale={locale} />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-md">
            <Link href={rutaPublica(locale, "rsvp")}>{t.inicio.confirmar}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-md">
            <Link href={rutaPublica(locale, "agenda")}>{t.inicio.verPrograma}</Link>
          </Button>
        </div>
      </section>

      <div className="mt-14 space-y-10">
        <Bloque titulo={t.inicio.loEsencial}>
          <ListaDatos items={esencial} />
        </Bloque>

        <Bloque titulo={t.inicio.masInfo}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(["agenda", "informacion", "mapa", "regalo"] as const).map((seccion) => (
              <li key={seccion}>
                <Link
                  href={rutaPublica(locale, seccion)}
                  className="block rounded-md border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {t.menu[seccion]} →
                </Link>
              </li>
            ))}
          </ul>
        </Bloque>
      </div>
    </main>
  );
}
