import Link from "next/link";
import { ArrowRightLeft, BusFront, Plus, Trash2, Users } from "lucide-react";
import { deleteBusAction, createBusAction, moveGuestToBusAction, updateBusAction } from "@/app/(admin)/autobuses/actions";
import { getBusAssignments, getBuses, getGuests } from "@/lib/data";
import type { BusStatus } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OccupancyBar } from "@/components/ui/occupancy-bar";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { plural } from "@/lib/format";

export const metadata = { title: "Autobuses" };

const busStatusOptions: Array<[BusStatus, string]> = [
  ["borrador", "Borrador"],
  ["cotizado", "Cotizado"],
  ["confirmado", "Confirmado"]
];

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

export default async function BusesPage() {
  const [guests, buses, assignments] = await Promise.all([getGuests(), getBuses(), getBusAssignments()]);
  const guestsById = new Map(guests.map((guest) => [guest.id, guest]));
  const busByGuestId = new Map<string, string>();
  const passengersByBusId = new Map<string, typeof guests>();

  for (const assignment of assignments) {
    if (busByGuestId.has(assignment.invitado_id)) {
      continue;
    }

    const guest = guestsById.get(assignment.invitado_id);
    if (!guest) {
      continue;
    }

    busByGuestId.set(assignment.invitado_id, assignment.autobus_id);
    const list = passengersByBusId.get(assignment.autobus_id) ?? [];
    list.push(guest);
    passengersByBusId.set(assignment.autobus_id, list);
  }

  const guestsWithBusRequest = guests.filter((guest) => guest.necesita_autobus);
  const pendingBusGuests = guestsWithBusRequest.filter((guest) => !busByGuestId.has(guest.id));
  const assignedPassengerCount = busByGuestId.size;
  const totalCapacity = buses.reduce((sum, bus) => sum + bus.capacidad, 0);
  const freeSeats = Math.max(totalCapacity - assignedPassengerCount, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Logística"
        title="Autobuses"
        description="Gestiona rutas, capacidad, paradas y horarios. Asigna pasajeros desde aquí o desde la ficha del invitado."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{buses.length} {plural(buses.length, "bus", "buses")}</Badge>
            <Badge variant="secondary">{assignedPassengerCount} pasajeros</Badge>
            <Badge variant={pendingBusGuests.length > 0 ? "warning" : "success"}>
              {pendingBusGuests.length} {plural(pendingBusGuests.length, "pendiente")}
            </Badge>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BusFront} value={buses.length} label="Flota" note="Vehículos planificados para el traslado." />
        <StatCard icon={Users} value={assignedPassengerCount} label="Pasajeros" note="Invitados ya distribuidos en buses." />
        <StatCard
          icon={ArrowRightLeft}
          value={pendingBusGuests.length}
          label="Pendientes"
          note="Invitados que siguen sin bus asignado."
          tone={pendingBusGuests.length > 0 ? "warning" : "success"}
        />
        <StatCard icon={BusFront} value={freeSeats} label="Plazas libres" note="Capacidad aún disponible en la flota." />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Nuevo bus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBusAction} className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="bus-new-nombre" required>Nombre</Label>
              <Input id="bus-new-nombre" name="nombre" placeholder="Bus centro" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bus-new-proveedor">Proveedor</Label>
              <Input id="bus-new-proveedor" name="proveedor" placeholder="Autocares Ejemplo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bus-new-capacidad" required>Capacidad</Label>
              <Input id="bus-new-capacidad" name="capacidad" min="1" type="number" defaultValue={40} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bus-new-estado">Estado</Label>
              <Select id="bus-new-estado" name="estado" defaultValue="borrador">
                {busStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="bus-new-paradas">Paradas</Label>
              <Textarea id="bus-new-paradas" name="paradas" placeholder={"Estación central\nPlaza mayor\nFinca"} rows={4} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bus-new-horarios">Horarios</Label>
              <Input id="bus-new-horarios" name="horarios" placeholder="16:30 ida / 03:15 vuelta" />
            </div>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="bus-new-notas">Notas</Label>
              <Textarea id="bus-new-notas" name="notas" placeholder="Ruta principal desde la ciudad." />
            </div>
            <SubmitButton className="lg:col-span-4" pendingText="Creando…">
              Crear bus
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-primary" />
            Asignar pasajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={moveGuestToBusAction} className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="bus-assign-guest">Invitado</Label>
              <Select id="bus-assign-guest" name="guest_id" defaultValue="">
                <option value="">Elige un invitado</option>
                {guests.map((guest) => {
                  const currentBusId = busByGuestId.get(guest.id);
                  const currentBusName = currentBusId ? buses.find((bus) => bus.id === currentBusId)?.nombre : null;

                  return (
                    <option key={guest.id} value={guest.id}>
                      {guest.nombre} {guest.apellidos}
                      {guest.necesita_autobus ? " - Pide bus" : " - Bus opcional"}
                      {currentBusName ? ` - ${currentBusName}` : " - Sin bus"}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bus-assign-destino">Bus destino</Label>
              <Select id="bus-assign-destino" name="autobus_id" defaultValue="">
                <option value="">Sin bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton className="self-end" pendingText="Asignando…">
              Asignar
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {buses.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={BusFront} title="Sin buses" text="Crea la primera ruta para empezar a repartir los traslados." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {buses.map((bus) => {
            const passengers = passengersByBusId.get(bus.id) ?? [];
            const used = passengers.length;
            const remaining = Math.max(bus.capacidad - used, 0);

            return (
              <Card key={bus.id}>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        <Link className="transition-colors hover:text-primary" href={`/autobuses/${bus.id}`}>
                          {bus.nombre}
                        </Link>
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {used}/{bus.capacidad} ocupados - {remaining} libres
                      </p>
                    </div>
                    <Badge variant={getBusStatusVariant(bus.estado)}>{busStatusLabels[bus.estado]}</Badge>
                  </div>

                  <OccupancyBar used={used} capacity={bus.capacidad} />

                  <form action={updateBusAction} className="grid gap-3 lg:grid-cols-[1.3fr_1.1fr_0.5fr]">
                    <input name="id" type="hidden" value={bus.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`bus-${bus.id}-nombre`} required>Nombre</Label>
                      <Input id={`bus-${bus.id}-nombre`} name="nombre" defaultValue={bus.nombre} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`bus-${bus.id}-proveedor`}>Proveedor</Label>
                      <Input id={`bus-${bus.id}-proveedor`} name="proveedor" defaultValue={bus.proveedor ?? ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`bus-${bus.id}-capacidad`} required>Capacidad</Label>
                      <Input id={`bus-${bus.id}-capacidad`} name="capacidad" min="1" type="number" defaultValue={bus.capacidad} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`bus-${bus.id}-estado`}>Estado</Label>
                      <Select id={`bus-${bus.id}-estado`} name="estado" defaultValue={bus.estado}>
                        {busStatusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2 lg:col-span-3">
                      <Label htmlFor={`bus-${bus.id}-horarios`}>Horarios</Label>
                      <Input id={`bus-${bus.id}-horarios`} name="horarios" defaultValue={bus.horarios ?? ""} />
                    </div>
                    <div className="grid gap-2 lg:col-span-3">
                      <Label htmlFor={`bus-${bus.id}-paradas`}>Paradas</Label>
                      <Textarea id={`bus-${bus.id}-paradas`} name="paradas" defaultValue={bus.paradas.join("\n")} rows={4} />
                    </div>
                    <div className="grid gap-2 lg:col-span-3">
                      <Label htmlFor={`bus-${bus.id}-notas`}>Notas</Label>
                      <Textarea id={`bus-${bus.id}-notas`} name="notas" defaultValue={bus.notas ?? ""} />
                    </div>
                    <SubmitButton className="lg:col-span-3" pendingText="Guardando…">
                      Guardar cambios
                    </SubmitButton>
                  </form>

                  <div className="flex justify-end">
                    <form action={deleteBusAction}>
                      <input name="id" type="hidden" value={bus.id} />
                      <ConfirmSubmit confirmText={`¿Eliminar el bus «${bus.nombre}»? Esta acción no se puede deshacer.`}>
                        <Trash2 className="size-4" />
                        Eliminar bus
                      </ConfirmSubmit>
                    </form>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Pasajeros asignados</p>
                    {passengers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nadie asignado todavía.</p>
                    ) : (
                      <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                        {passengers.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                              <div>
                                <div className="font-medium">
                                  {guest.nombre} {guest.apellidos}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {guest.grupo || "Sin grupo"} · {guest.mesa_nombre || "Sin mesa"} · {guest.necesita_autobus ? "Pide bus" : "Bus opcional"}
                                </div>
                              </div>
                            </div>
                            <form action={moveGuestToBusAction}>
                              <input name="guest_id" type="hidden" value={guest.id} />
                              <input name="autobus_id" type="hidden" value="" />
                              <Button size="sm" type="submit" variant="ghost">
                                Quitar
                              </Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
