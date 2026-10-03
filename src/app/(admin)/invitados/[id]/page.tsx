import Link from "next/link";
import { mensajes } from "@/config/boda";
import { rellenarMensaje } from "@/lib/mensajes";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Barcode,
  BusFront,
  CalendarClock,
  History,
  Link2,
  Mail,
  MapPin,
  Phone,
  Zap,
  Table2,
  Users
} from "lucide-react";
import { getAuditEvents, getGuestById } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { formatInvitationCode } from "@/lib/invitation-code";
import { auditActionLabel, formatDateTime, localeLabel, plural, rsvpBadgeVariant, rsvpLabel } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { getBuses, getBusAssignments, getTables } from "@/lib/data";
import { moveGuestToBusAction } from "@/app/(admin)/autobuses/actions";
import { moveGuestToTableAction } from "@/app/(admin)/mesas/actions";
import { SendEmailButton } from "@/components/send-email-button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { buildRsvpUrl } from "@/lib/rsvp-link";

export const metadata = { title: "Invitado" };

// Formato único de fecha+hora del panel: src/lib/format.ts. Aquí solo decidimos
// el placeholder cuando no hay dato, evitando reimplementar el formateo.
function displayDateTime(value: string | null) {
  return formatDateTime(value) ?? "Sin dato";
}

function getAuditVariant(action: string) {
  if (action === "deleted") {
    return "danger";
  }

  if (action === "updated" || action === "moved") {
    return "warning";
  }

  return "success";
}

export default async function GuestDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [guest, siteUrl, auditEvents, tables, buses, busAssignments] = await Promise.all([
    getGuestById(id),
    getSiteUrl(),
    getAuditEvents("invitado", id),
    getTables(),
    getBuses(),
    getBusAssignments()
  ]);

  if (!guest) {
    notFound();
  }

  const guestName = `${guest.nombre} ${guest.apellidos}`.trim();
  const invitationCode = formatInvitationCode(guest.codigo_invitacion);
  const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);
  const whatsappUrl = buildWhatsappUrl(rellenarMensaje(mensajes.whatsappInvitacion, { nombre: guest.nombre, enlace: rsvpUrl }));
  const menuLabel = menuChoiceOptions.find((option) => option.value === guest.menu_elegido)?.label ?? guest.menu_elegido;
  const assignedBusId = busAssignments.find((assignment) => assignment.invitado_id === guest.id)?.autobus_id ?? null;
  const assignedBusName = assignedBusId ? buses.find((bus) => bus.id === assignedBusId)?.nombre ?? null : null;

  const timeline = [
    { label: "Creado", value: guest.created_at },
    { label: "Actualizado", value: guest.updated_at },
    { label: "Primera vista", value: guest.rsvp_first_view_at },
    { label: "Última vista", value: guest.rsvp_last_view_at },
    { label: "Primera respuesta", value: guest.rsvp_first_submitted_at },
    { label: "Última respuesta", value: guest.rsvp_last_submitted_at }
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Invitados"
        title={guestName}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={rsvpBadgeVariant(guest.confirmacion_asistencia)}>{rsvpLabel(guest.confirmacion_asistencia)}</Badge>
            <Badge variant="secondary">{guest.rsvp_view_count} {plural(guest.rsvp_view_count, "vista")}</Badge>
            <Badge variant="secondary">{guest.rsvp_submit_count} {plural(guest.rsvp_submit_count, "respuesta")}</Badge>
            <Button asChild variant="outline">
              <Link href="/invitados">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="mb-6 overflow-hidden border-border/60">
        <CardContent className="relative p-5">
          <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <Avatar name={guest.nombre} surname={guest.apellidos} size="lg" showRing />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary/60">
                Código {invitationCode}
              </p>
              <p className="font-display text-3xl leading-tight">{guestName}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {guest.grupo || "Sin grupo"} · {guest.mesa_nombre || "Sin mesa"} · {menuLabel}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {guest.email ? (
                <a
                  href={`mailto:${guest.email}`}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Enviar correo"
                  title={guest.email}
                >
                  <Mail className="size-4" />
                </a>
              ) : null}
              {guest.telefono ? (
                <a
                  href={`tel:${guest.telefono}`}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Llamar"
                  title={guest.telefono}
                >
                  <Phone className="size-4" />
                </a>
              ) : null}
              <WhatsAppButton
                href={whatsappUrl}
                iconOnly
                label="Enviar por WhatsApp"
                className="size-11 rounded-full border-border/60 bg-background text-muted-foreground hover:border-success hover:bg-success hover:text-success-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Ficha del invitado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Código {invitationCode}</Badge>
                <Badge variant="outline">Mesa {guest.mesa_nombre || "Sin mesa"}</Badge>
                <Badge variant="outline">Grupo {guest.grupo || "Sin grupo"}</Badge>
              </div>
              <p className="text-muted-foreground">
                {guest.notas_internas || "Sin notas internas."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-card/70 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                {guest.email || "Sin correo"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                {guest.telefono || "Sin teléfono"}
              </div>
              <div className="flex items-center gap-2">
                <Table2 className="size-4 text-primary" />
                Mesa: {guest.mesa_nombre || "Sin mesa"}
              </div>
              <div className="flex items-center gap-2">
                <BusFront className="size-4 text-primary" />
                Autobús: {assignedBusName ?? (guest.necesita_autobus ? "Solicitado" : "No solicitado")}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Alojamiento: {guest.hotel_alojamiento || "Sin alojamiento"}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Asistencia</span>
                <span className="font-medium">{rsvpLabel(guest.confirmacion_asistencia)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Menú</span>
                <span className="font-medium">{menuLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Alergias</span>
                <span className="font-medium">{guest.alergias_intolerancias || "Sin alergias"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Comentarios</span>
                <span className="font-medium">{guest.comentarios || "Sin comentarios"}</span>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Link2 className="size-4" />
                Enlace RSVP
              </div>
              <p className="break-all font-mono text-xs text-foreground">{rsvpUrl}</p>
              <div className="grid gap-2">
                <SendEmailButton guestId={guest.id} hasEmail={Boolean(guest.email)} />
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={rsvpUrl} label="Copiar enlace" copiedLabel="¡Copiado!" />
                  <Button asChild variant="outline">
                    <Link href={`/invitados/${guest.id}/qr`}>
                      <Barcode className="size-4" />
                      Ver QR
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/invitados/${guest.id}/print`}>
                      🖨️ Tarjeta A6
                    </Link>
                  </Button>
                  <WhatsAppButton href={whatsappUrl} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              Historial RSVP
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {timeline.map((entry) => (
              <div key={entry.label} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4 text-sm">
                <span className="text-muted-foreground">{entry.label}</span>
                <span className="font-medium">{displayDateTime(entry.value)}</span>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-card/70 p-4 text-sm">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                Actividad reciente
              </div>
              <div className="grid gap-2 text-muted-foreground">
                <p>Vistas acumuladas: {guest.rsvp_view_count}</p>
                <p>Respuestas acumuladas: {guest.rsvp_submit_count}</p>
                <p>Último idioma: {localeLabel(guest.rsvp_last_locale)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <p className="mb-2 font-semibold">Código de invitación</p>
              <p className="font-mono text-lg tracking-[0.25em]">{invitationCode}</p>
              <p className="mt-2 text-muted-foreground">
                Este código alimenta tanto el acceso manual al RSVP como la ficha imprimible con QR.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <form action={moveGuestToTableAction} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="guest-quick-mesa">Mesa</Label>
              <Select id="guest-quick-mesa" name="mesa_id" defaultValue={guest.mesa_id ?? ""}>
                <option value="">Sin mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <input name="guest_id" type="hidden" value={guest.id} />
            <Button type="submit">Mover a mesa</Button>
          </form>

          <form action={moveGuestToBusAction} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="guest-quick-bus">Bus</Label>
              <Select id="guest-quick-bus" name="autobus_id" defaultValue={assignedBusId ?? ""}>
                <option value="">Sin bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <input name="guest_id" type="hidden" value={guest.id} />
            <Button type="submit">Asignar bus</Button>
          </form>

          <div className="grid gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm lg:col-span-2">
            <p className="font-semibold text-primary">Enlaces rápidos</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={rsvpUrl} rel="noreferrer" target="_blank">
                  Abrir RSVP público
                </a>
              </Button>
              <WhatsAppButton href={whatsappUrl}>Enviar por WhatsApp</WhatsAppButton>
              <Button asChild variant="outline">
                <Link href={`/invitados/${guest.id}/qr`}>
                  <Barcode className="size-4" />
                  Ver QR
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/invitados">Abrir listado</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            Historial de cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <EmptyState icon={History} title="Sin eventos" text="Todavía no hay cambios registrados para este invitado." />
          ) : (
            <ol className="relative grid gap-3 border-l-2 border-primary/15 pl-5">
              {auditEvents.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-3 flex size-6 items-center justify-center rounded-full border-2 border-primary/30 bg-card">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm hover-lift">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="mt-1 text-muted-foreground">{event.details ?? "Sin detalles."}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getAuditVariant(event.action)}>{auditActionLabel(event.action)}</Badge>
                        <Badge variant="outline">{displayDateTime(event.created_at)}</Badge>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
