import Link from "next/link";
import { ArrowLeft, BusFront, Link2, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { ProgressRing } from "@/components/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusAssignments, getBusById, getBuses, getGuests } from "@/lib/data";
import type { BusStatus } from "@/lib/types";

export const metadata = { title: "Autobús" };

const busStatusLabels: Record<BusStatus, string> = {
  borrador: "Borrador",
  cotizado: "Cotizado",
  confirmado: "Confirmado"
};

function getBusStatusVariant(status: BusStatus) {
  if (status === "confirmado") {
    return "success";
  }

  if (status === "cotizado") {
    return "warning";
  }

  return "secondary";
}

export default async function BusDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [bus, guests, assignments, buses] = await Promise.all([getBusById(id), getGuests(), getBusAssignments(), getBuses()]);

  if (!bus) {
    return (
      <div className="grid gap-4">
        <EmptyState icon={BusFront} title="Bus no encontrado" text="La ruta solicitada no existe o ya fue eliminada." />
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/autobuses">
              <ArrowLeft className="size-4" />
              Volver a autobuses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const passengerIds = new Set(assignments.filter((assignment) => assignment.autobus_id === bus.id).map((assignment) => assignment.invitado_id));
  const passengers = guests.filter((guest) => passengerIds.has(guest.id));
  const pendingGuests = guests.filter((guest) => guest.necesita_autobus && !passengerIds.has(guest.id));
  const usedSeats = passengers.length;
  const freeSeats = Math.max(bus.capacidad - usedSeats, 0);
  const sameProviderBuses = buses.filter((otherBus) => otherBus.proveedor === bus.proveedor && otherBus.id !== bus.id);

  return (
    <>
      <AdminPageHeader
        eyebrow="Autobús"
        title={bus.nombre}
        description={`Capacidad ${bus.capacidad} · ${freeSeats} plazas libres`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={getBusStatusVariant(bus.estado)}>{busStatusLabels[bus.estado]}</Badge>
            <Badge variant="secondary">{usedSeats}/{bus.capacidad} pasajeros</Badge>
            <Badge variant={freeSeats === 0 ? "danger" : freeSeats <= 2 ? "warning" : "success"}>
              {freeSeats === 0 ? "Lleno" : `${freeSeats} libres`}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/autobuses">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BusFront className="size-4 text-primary" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Proveedor</p>
              <p className="mt-1 text-lg font-semibold">{bus.proveedor || "Sin proveedor"}</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/70 p-4">
              <ProgressRing
                value={usedSeats}
                total={bus.capacidad}
                tone={freeSeats === 0 ? "success" : freeSeats <= 2 ? "warning" : "primary"}
                size={88}
                thickness={8}
                sublabel={`${usedSeats}/${bus.capacidad}`}
              />
              <div className="text-sm">
                <p className="text-muted-foreground">Capacidad</p>
                <p className="font-display text-2xl leading-none">{bus.capacidad}</p>
                <p className="mt-1 text-xs text-muted-foreground">{freeSeats} libres</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Horarios</p>
              <p className="mt-1 leading-6">{bus.horarios || "Sin horarios"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Paradas</p>
              <p className="mt-1 leading-6">{bus.paradas.length > 0 ? bus.paradas.join(" · ") : "Sin paradas"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <p className="text-muted-foreground">Notas</p>
              <p className="mt-1 leading-6">{bus.notas || "Sin notas"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Pasajeros y pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Pasajeros</p>
              {passengers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay pasajeros asignados.</p>
              ) : (
                passengers.map((guest) => (
                  <div key={guest.id} className="hover-lift rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={guest.nombre} surname={guest.apellidos} size="md" />
                        <div>
                          <p className="font-semibold">{`${guest.nombre} ${guest.apellidos}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {guest.grupo || "Sin grupo"} · {guest.confirmacion_asistencia} · {guest.mesa_nombre || "Sin mesa"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/invitados/${guest.id}`}>Ver ficha</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/invitados/${guest.id}/qr`}>Ver QR</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Pendientes</p>
              {pendingGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay invitados pendientes para bus.</p>
              ) : (
                <div className="grid gap-2">
                  {pendingGuests.map((guest) => (
                    <div key={guest.id} className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3 text-sm">
                      {guest.nombre} {guest.apellidos}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sameProviderBuses.length > 0 ? (
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Otras rutas del proveedor</p>
                <div className="grid gap-2">
                  {sameProviderBuses.map((otherBus) => (
                    <div key={otherBus.id} className="rounded-2xl border border-border bg-background/70 p-3 text-sm">
                      <p className="font-medium">{otherBus.nombre}</p>
                      <p className="text-muted-foreground">{otherBus.capacidad} plazas · {otherBus.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/autobuses">Abrir listado</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/invitados">Ver invitados</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mesas">Ver mesas</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
