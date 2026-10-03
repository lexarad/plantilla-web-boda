import Link from "next/link";
import { evento, nombresPareja, pareja, textos } from "@/config/boda";
import { CuentaAtras } from "@/components/publico/cuenta-atras";
import { ListaDatos } from "@/components/publico/pagina";
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
    <main id="main" lang={locale} className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <EventJsonLd descripcion={texto.descripcionSeo} />

      {estado === "en-preparacion" ? (
        <p role="status" className="mb-8 rounded-md border border-border bg-muted px-4 py-3 text-sm">
          {t.inicio.preparacion}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">{nombresPareja}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{texto.antetitulo}</p>
          <p className="mt-6 max-w-lg text-base leading-7">{texto.bienvenida}</p>
          <Button asChild size="lg" className="mt-8 rounded-md">
            <Link href={rutaPublica(locale, "rsvp")}>{t.inicio.confirmar}</Link>
          </Button>
        </section>

        <aside aria-label={t.inicio.loEsencial} className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-semibold">{t.inicio.loEsencial}</h2>
            <CuentaAtras fechaIso={d.eventDateTimeIso} locale={locale} />
          </div>
          <ListaDatos items={esencial} />
        </aside>
      </div>

      <nav aria-label={t.inicio.masInfo} className="mt-14 border-t border-border pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          {(["agenda", "informacion", "mapa", "regalo"] as const).map((seccion) => (
            <li key={seccion}>
              <Link href={rutaPublica(locale, seccion)} className="text-primary underline-offset-4 hover:underline">
                {t.menu[seccion]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
