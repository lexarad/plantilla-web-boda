import type { Metadata } from "next";
import { Bloque, ListaDatos, Pagina } from "@/components/publico/pagina";
import { Button } from "@/components/ui/button";
import { resolveLocale } from "@/lib/locale";
import { textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return { title: textosWeb[locale].mapa.titulo };
}

export default async function MapaPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = resolveLocale((await params).lang);
  const t = textosWeb[locale];
  const d = getWeddingDetails(locale);
  const query = encodeURIComponent(d.venueMapQuery);

  const enlaces = [
    { nombre: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${query}` },
    { nombre: "Apple Maps", href: `https://maps.apple.com/?q=${query}` },
    { nombre: "Waze", href: `https://www.waze.com/ul?q=${query}&navigate=yes` }
  ];

  return (
    <Pagina titulo={t.mapa.titulo} intro={`${d.venueName} · ${d.venueMapQuery}`} locale={locale}>
      <div className="overflow-hidden rounded-md border border-border">
        <iframe
          title={t.mapa.mapaDe(d.venueName)}
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          className="h-[360px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t.mapa.abrirEn}</span>
        {enlaces.map((enlace) => (
          <Button key={enlace.nombre} asChild size="sm" variant="outline" className="rounded-md">
            <a href={enlace.href} target="_blank" rel="noreferrer">
              {enlace.nombre}
            </a>
          </Button>
        ))}
      </div>

      {d.busEnabled ? (
        <Bloque titulo={d.transportLabel}>
          <ListaDatos
            items={[
              { etiqueta: t.mapa.parada, valor: d.busStopLabel },
              { etiqueta: t.mapa.salida, valor: d.busDeparture },
              { etiqueta: t.mapa.regresos, valor: d.busReturns.join(" · ") }
            ]}
          />
          <p className="text-sm text-muted-foreground">{d.busStopDetail}</p>
        </Bloque>
      ) : null}
    </Pagina>
  );
}
