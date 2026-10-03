import type { Metadata } from "next";
import { nombresPareja, programa } from "@/config/boda";
import { AddToCalendar } from "@/components/add-to-calendar";
import { Pagina } from "@/components/publico/pagina";
import { resolveLocale } from "@/lib/locale";
import { getTimelineEvents } from "@/lib/data";
import { textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return { title: textosWeb[locale].agenda.titulo };
}

/** Minutos desde el inicio del día; la madrugada (00–04) cuenta como noche siguiente. */
function minutosDelDia(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return ((h < 5 ? h + 24 : h) * 60) + (m || 0);
}

export default async function AgendaPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = resolveLocale((await params).lang);
  const t = textosWeb[locale];
  const d = getWeddingDetails(locale);
  // Programa fijo de la configuración + los momentos que se añadan desde el
  // panel (Cronograma), ordenados por hora.
  const eventos = await getTimelineEvents();
  const momentos = [
    ...programa[locale],
    ...eventos.map((evento) => ({
      hora: evento.hora,
      titulo: (locale === "ca" && evento.titulo_ca) || evento.titulo,
      texto: (locale === "ca" && evento.descripcion_ca) || evento.descripcion || ""
    }))
  ].sort((a, b) => minutosDelDia(a.hora) - minutosDelDia(b.hora));

  return (
    <Pagina titulo={t.agenda.titulo} intro={`${d.dateLabel} · ${d.venueName}`} locale={locale}>
      <ol className="divide-y divide-border rounded-md border border-border">
        {momentos.map((momento) => (
          <li key={`${momento.hora}-${momento.titulo}`} className="grid grid-cols-[4.5rem_1fr] gap-4 px-4 py-4">
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{momento.hora}</span>
            <div>
              <p className="font-medium">{momento.titulo}</p>
              {momento.texto ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{momento.texto}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      <AddToCalendar
        title={nombresPareja}
        description={`${d.venueName}, ${d.venueLocation}`}
        location={`${d.venueName}, ${d.venueMapQuery}`}
        startIso={d.eventDateTimeIso}
        endIso={d.eventEndIso}
        locale={locale}
      />
    </Pagina>
  );
}
