import Link from "next/link";
import { ArrowLeft, BadgeCheck, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { nombresPareja } from "@/config/boda";
import { getGuestById } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { getWeddingDetails } from "@/lib/wedding-details";
import { formatInvitationCode } from "@/lib/invitation-code";
import { buildQrSvg } from "@/lib/qr";
import { CopyButton } from "@/components/copy-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/print-button";
import { plural } from "@/lib/format";
import { buildRsvpUrl } from "@/lib/rsvp-link";

export const metadata = { title: "Ficha QR" };

export default async function GuestQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [guest, siteUrl] = await Promise.all([getGuestById(id), getSiteUrl()]);

  if (!guest) {
    notFound();
  }

  const invitationCode = formatInvitationCode(guest.codigo_invitacion);
  const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);
  const qrSvg = await buildQrSvg(rsvpUrl, 360);
  const guestName = `${guest.nombre} ${guest.apellidos}`.trim();
  const details = getWeddingDetails("es");

  return (
    <div className="space-y-6 print:space-y-4">
      <AdminPageHeader
        eyebrow="Invitados"
        title={`QR de ${guestName}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/invitados">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
            <PrintButton label="Imprimir QR" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border bg-background/90 shadow-panel print:hidden">
          <CardHeader className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              <BadgeCheck className="mr-1 size-3.5" />
              Invitación personal
            </Badge>
            <CardTitle className="font-display text-3xl leading-tight">{guestName}</CardTitle>
            <p className="text-base leading-7 text-muted-foreground">
              Al escanear el QR, {guest.nombre} llega a su página personal y puede responder sin escribir nada.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Código de invitación</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.25em] text-foreground">{invitationCode}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                También sirve escribirlo a mano en la página «Confirmar asistencia» de la web.
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Enlace personal</p>
              <div className="mt-2 flex items-start gap-2 text-sm text-foreground">
                <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="flex-1 break-all">{rsvpUrl}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={rsvpUrl} label="Copiar enlace" copiedLabel="¡Copiado!" />
                <CopyButton text={invitationCode} label={`Copiar código (${invitationCode})`} copiedLabel="¡Copiado!" variant="ghost" />
              </div>
            </div>

            <div className="grid gap-3 rounded-3xl border border-border bg-card/80 p-4 text-sm leading-7">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Grupo</span>
                <span className="font-medium">{guest.grupo || "Sin grupo"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Mesa</span>
                <span className="font-medium">{guest.mesa_nombre || "Sin mesa"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Accesos</span>
                <span className="font-medium">{guest.rsvp_view_count} {plural(guest.rsvp_view_count, "vista")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Envíos</span>
                <span className="font-medium">{guest.rsvp_submit_count} {plural(guest.rsvp_submit_count, "respuesta")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ficha que se imprime: invitado arriba, QR en el centro y la boda abajo. */}
        <Card className="overflow-hidden border-border bg-background/95 shadow-panel print:border-0 print:shadow-none">
          <CardContent className="grid place-items-center gap-5 p-8 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Para</p>
              <p className="font-display text-2xl font-semibold">{guestName}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-5 print:border-black/20">
              <div className="qr-sheet" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            <p className="text-sm text-muted-foreground">
              Escanea para responder · o escribe el código <span className="font-mono font-medium text-foreground">{invitationCode}</span>
            </p>
            <div className="border-t border-border pt-4">
              <p className="font-display text-xl font-semibold">{nombresPareja}</p>
              <p className="text-sm text-muted-foreground">
                {details.dateShort} · {details.venueLabel}, {details.venueLocation}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
