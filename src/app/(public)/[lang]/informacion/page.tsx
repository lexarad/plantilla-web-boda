import type { Metadata } from "next";
import { preguntas } from "@/config/boda";
import { Bloque, ListaDatos, Pagina } from "@/components/publico/pagina";
import { getWeddingSettings } from "@/lib/data";
import { resolveLocale } from "@/lib/locale";
import { textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return { title: textosWeb[locale].informacion.titulo };
}

export default async function InformacionPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = resolveLocale((await params).lang);
  const t = textosWeb[locale];
  const d = getWeddingDetails(locale);
  // Teléfono, email y hoteles salen de las variables de entorno (o de Ajustes
  // en modo demo): no se publican desde el código.
  const settings = await getWeddingSettings();

  const contacto = [
    ...(settings.contactPhone
      ? [{ etiqueta: t.informacion.telefono, valor: <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}>{settings.contactPhone}</a> }]
      : []),
    ...(settings.contactEmail
      ? [{ etiqueta: t.informacion.email, valor: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> }]
      : [])
  ];

  return (
    <Pagina titulo={t.informacion.titulo} intro={t.informacion.intro} locale={locale}>
      <ListaDatos
        items={[
          { etiqueta: t.inicio.fecha, valor: d.dateLabel },
          { etiqueta: t.inicio.lugar, valor: `${d.venueName} · ${d.venueLocation}` },
          { etiqueta: t.inicio.vestimenta, valor: d.dressCode },
          { etiqueta: t.inicio.confirmarAntes, valor: d.rsvpDeadline }
        ]}
      />

      <Bloque titulo={t.informacion.preguntas}>
        <div className="divide-y divide-border rounded-md border border-border">
          {preguntas[locale].map((item) => (
            <details key={item.pregunta} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
                <span className="mr-2 inline-block text-muted-foreground transition-transform group-open:rotate-90">›</span>
                {item.pregunta}
              </summary>
              <p className="mt-2 pl-5 text-sm leading-6 text-muted-foreground">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </Bloque>

      {settings.hotelSuggestions ? (
        <Bloque titulo={t.informacion.alojamiento}>
          <p className="whitespace-pre-line text-sm leading-6">{settings.hotelSuggestions}</p>
        </Bloque>
      ) : null}

      {contacto.length > 0 ? (
        <Bloque titulo={t.informacion.contacto}>
          <ListaDatos items={contacto} />
        </Bloque>
      ) : null}
    </Pagina>
  );
}
