import Link from "next/link";
import { nombresParejaEnFrase } from "@/config/boda";
import { CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import { getGuests } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { plural, rsvpBadgeVariant, rsvpLabel } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { Avatar } from "@/components/avatar";
import { CountUp } from "@/components/count-up";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Guest } from "@/lib/types";
import { buildRsvpUrl } from "@/lib/rsvp-link";

export const metadata = { title: "Grupos" };

function groupStatusVariant(confirmed: number, total: number, declined: number) {
  if (confirmed === total) return "success";
  if (declined === total) return "danger";
  if (confirmed + declined === total) return "secondary";
  return "warning";
}

function groupStatusLabel(confirmed: number, total: number, declined: number) {
  if (confirmed === total) return "Todo confirmado";
  if (declined === total) return "Todos declinan";
  const pending = total - confirmed - declined;
  if (pending === 0) return "Respondido";
  return `${pending} pendiente${pending > 1 ? "s" : ""}`;
}

function buildWhatsappGroupUrl(guests: Guest[], siteUrl: string) {
  const names = guests.map((g) => g.nombre).join(", ");
  const links = guests
    .map((g) => `• ${g.nombre}: ${buildRsvpUrl(siteUrl, g.codigo_invitacion)}`)
    .join("\n");
  const text = `¡Hola ${names}! Os enviamos vuestros enlaces personales para confirmar asistencia a la boda de ${nombresParejaEnFrase.es}:\n${links}`;
  return buildWhatsappUrl(text);
}

export default async function GroupsPage() {
  const [guests, siteUrl] = await Promise.all([getGuests(), getSiteUrl()]);

  const grouped = new Map<string, Guest[]>();
  const sinGrupo: Guest[] = [];

  for (const guest of guests) {
    const key = guest.grupo?.trim() || "";
    if (!key) {
      sinGrupo.push(guest);
    } else {
      const list = grouped.get(key) ?? [];
      list.push(guest);
      grouped.set(key, list);
    }
  }

  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  const totalGroups = sortedGroups.length + (sinGrupo.length > 0 ? 1 : 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Invitados"
        title="Grupos y familias"
        description="Agrupa por familia o entorno para enviar invitaciones y trabajar las respuestas en bloque."
        actions={
          <>
            <Badge variant="secondary">{totalGroups} {plural(totalGroups, "grupo")}</Badge>
            <Badge variant="secondary">{guests.length} invitados</Badge>
          </>
        }
      />

      {/* Aggregate dashboard */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Estado de cada grupo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cada barra muestra, de un vistazo, cuántos han confirmado (verde), cuántos no asisten (rojo) y cuántos
            faltan por contestar (ámbar). Toca un grupo para ver el detalle.
          </p>
        </CardHeader>
        <CardContent>
          {sortedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay grupos definidos.</p>
          ) : (
            <ul className="grid gap-2">
              {sortedGroups
                .slice()
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([name, list]) => {
                  const confirmed = list.filter((g) => g.confirmacion_asistencia === "confirmado").length;
                  const declined = list.filter((g) => g.confirmacion_asistencia === "rechazado").length;
                  const pending = list.length - confirmed - declined;
                  const pct = (n: number) => (list.length > 0 ? (n / list.length) * 100 : 0);
                  return (
                    <li key={name} className="grid gap-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <a href={`#grp-${encodeURIComponent(name)}`} className="font-medium hover:text-primary truncate">
                          {name}
                        </a>
                        <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                          <span className="text-success">✓ {confirmed}</span>
                          <span className="text-destructive">✗ {declined}</span>
                          <span className="text-warning">· {pending} pendiente{pending === 1 ? "" : "s"}</span>
                          <span className="font-bold text-foreground">{list.length}</span>
                        </div>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <div className="bg-success" style={{ width: `${pct(confirmed)}%` }} title={`${confirmed} ${plural(confirmed, "confirmado")}`} />
                        <div className="bg-destructive" style={{ width: `${pct(declined)}%` }} title={`${declined} no asisten`} />
                        <div className="bg-warning" style={{ width: `${pct(pending)}%` }} title={`${pending} ${plural(pending, "pendiente")}`} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedGroups.map(([groupName, groupGuests]) => {
          const confirmed = groupGuests.filter((g) => g.confirmacion_asistencia === "confirmado").length;
          const declined = groupGuests.filter((g) => g.confirmacion_asistencia === "rechazado").length;
          const pending = groupGuests.filter((g) => g.confirmacion_asistencia === "pendiente").length;
          const total = groupGuests.length;
          const whatsappUrl = buildWhatsappGroupUrl(groupGuests, siteUrl);

          return (
            <Card key={groupName} id={`grp-${encodeURIComponent(groupName)}`} className="hover-lift scroll-mt-24">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4 text-primary" />
                    {groupName}
                  </CardTitle>
                  <Badge variant={groupStatusVariant(confirmed, total, declined)}>
                    {groupStatusLabel(confirmed, total, declined)}
                  </Badge>
                </div>
                {/* Avatar stack */}
                <div className="flex items-center -space-x-2">
                  {groupGuests.slice(0, 5).map((guest) => (
                    <div key={guest.id} className="rounded-full ring-2 ring-card">
                      <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                    </div>
                  ))}
                  {groupGuests.length > 5 ? (
                    <span className="relative z-10 inline-flex size-8 items-center justify-center rounded-full bg-muted ring-2 ring-card text-[10px] font-bold text-muted-foreground">
                      +{groupGuests.length - 5}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {confirmed > 0 && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-3" />
                      <CountUp to={confirmed} /> confirmado{confirmed > 1 ? "s" : ""}
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <Clock3 className="size-3" />
                      <CountUp to={pending} /> pendiente{pending > 1 ? "s" : ""}
                    </span>
                  )}
                  {declined > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="size-3" />
                      <CountUp to={declined} /> no asiste{declined > 1 ? "n" : ""}
                    </span>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${total > 0 ? (confirmed / total) * 100 : 0}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-1.5">
                  {groupGuests.map((guest) => {
                    const menuLabel = menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label;
                    const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);

                    return (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/invitados/${guest.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {guest.nombre} {guest.apellidos}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {menuLabel}{guest.alergias_intolerancias ? " · ⚠ " + guest.alergias_intolerancias : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={rsvpBadgeVariant(guest.confirmacion_asistencia)}>
                            {rsvpLabel(guest.confirmacion_asistencia)}
                          </Badge>
                          <WhatsAppButton
                            href={buildWhatsappUrl(`¡Hola ${guest.nombre}! Tu enlace para la boda: ${rsvpUrl}`)}
                            variant="ghost"
                            size="icon"
                            iconOnly
                            label={`Enviar WhatsApp a ${guest.nombre}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <WhatsAppButton href={whatsappUrl} size="sm">
                    WhatsApp al grupo
                  </WhatsAppButton>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sinGrupo.length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                <Users className="size-4" />
                Sin grupo asignado
              </CardTitle>
              <Badge variant="secondary">{sinGrupo.length} {plural(sinGrupo.length, "invitado")}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1.5">
                {sinGrupo.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  >
                    <Link href={`/invitados/${guest.id}`} className="font-medium hover:text-primary transition-colors">
                      {guest.nombre} {guest.apellidos}
                    </Link>
                    <Badge variant={rsvpBadgeVariant(guest.confirmacion_asistencia)}>
                      {rsvpLabel(guest.confirmacion_asistencia)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
