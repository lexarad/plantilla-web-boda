import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { nombresPareja } from "@/config/boda";
import { WEDDING_LOCALES } from "@/lib/locale";
import { getGuestById } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { getWeddingDetails } from "@/lib/wedding-details";
import { formatInvitationCode } from "@/lib/invitation-code";
import { buildQrSvg } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { buildRsvpUrl } from "@/lib/rsvp-link";

export const metadata = { title: "Tarjeta A6" };

export default async function GuestPrintCardPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const locale = query.lang === "ca" && WEDDING_LOCALES.includes("ca") ? "ca" : "es";
  const [guest, siteUrl] = await Promise.all([getGuestById(id), getSiteUrl()]);

  if (!guest) {
    notFound();
  }

  const details = getWeddingDetails(locale);
  const code = formatInvitationCode(guest.codigo_invitacion);
  const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);
  const qrSvg = await buildQrSvg(rsvpUrl, 170);
  const fullName = `${guest.nombre} ${guest.apellidos}`.trim();

  return (
    <>
      {/* Print-only stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A6 portrait; margin: 0; }
            @media print {
              html, body { background: white !important; }
              .print-controls, header, nav, footer, aside, [data-admin-shell] { display: none !important; }
              .print-card {
                width: 105mm;
                height: 148mm;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: always;
              }
            }
          `
        }}
      />

      <div className="print-controls mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Imprimible</p>
          <h1 className="font-display text-3xl leading-tight">Tarjeta física A6 · {fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pensada para imprimir en A6 (105×148 mm) y enviar por correo postal. El QR lleva al RSVP personal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/invitados/${guest.id}`}>
              <ArrowLeft className="size-4" />
              Volver a la ficha
            </Link>
          </Button>
          {WEDDING_LOCALES.includes("ca") ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/invitados/${guest.id}/print?lang=${locale === "es" ? "ca" : "es"}`}>
                {locale === "ca" ? "Veure en castellà" : "Ver en catalán"}
              </Link>
            </Button>
          ) : null}
          <PrintButton label="Imprimir tarjeta" />
        </div>
      </div>

      {/* La tarjeta. Representa PAPEL impreso: tinta fija (neutral-*), no
          tokens del tema, para que se lea igual en claro y en oscuro. */}
      <div className="mx-auto flex justify-center">
        <article
          className="print-card relative overflow-hidden border border-neutral-300 bg-white text-neutral-900 shadow-panel"
          style={{ width: "105mm", height: "148mm" }}
        >
          {/* Composición: fecha arriba a la izquierda, nombre del invitado como
              protagonista, QR abajo a la derecha. */}
          <div className="flex h-full flex-col justify-between p-7">
            <div>
              <p className="text-xs font-medium text-neutral-500">{details.dateLabel}</p>
              <p className="text-xs text-neutral-500">
                {details.venueLabel} · {details.venueLocation}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">{locale === "ca" ? "Ens fa il·lusió que vinguis," : "Nos encantará verte,"}</p>
              <p className="mt-1 text-2xl font-semibold leading-tight">{fullName}</p>
              <p className="mt-4 font-display text-base">{nombresPareja}</p>
            </div>

            <div className="flex items-end justify-between gap-4">
              <p className="max-w-[45%] text-[10px] leading-4 text-neutral-500">
                {locale === "ca" ? "Respon aquí amb la càmera del mòbil." : "Responde aquí con la cámara del móvil."}
                <br />
                <span className="font-mono text-xs tracking-widest text-neutral-900">{code}</span>
              </p>
              <div className="bg-white" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
          </div>
        </article>
      </div>

      <div className="print-controls mx-auto mt-6 max-w-xl rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground print:hidden">
        <p className="font-semibold text-foreground mb-1">Consejos de impresión</p>
        <ul className="grid gap-1 pl-4 list-disc">
          <li>Usa papel grueso (250-300 g/m²) tipo cartulina mate o satinada.</li>
          <li>En el diálogo de imprimir: tamaño A6, sin márgenes, escala 100%.</li>
          <li>Imprime varias páginas en A4 si quieres maquetar manualmente.</li>
        </ul>
      </div>
    </>
  );
}
