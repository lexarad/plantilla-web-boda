import Link from "next/link";
import { ArrowRightLeft, Map as MapIcon, Plus, Table2, Trash2, Users } from "lucide-react";
import { createTableAction, deleteTableAction, moveGuestToTableAction, updateTableAction } from "@/app/(admin)/mesas/actions";
import { getGuests, getTables } from "@/lib/data";
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

export const metadata = { title: "Mesas" };

export default async function TablesPage() {
  const [guests, tables] = await Promise.all([getGuests(), getTables()]);
  const guestsByTable = new Map<string, typeof guests>();
  const unassignedGuests = guests.filter((guest) => !guest.mesa_id);

  for (const guest of guests) {
    if (!guest.mesa_id) {
      continue;
    }

    const list = guestsByTable.get(guest.mesa_id) ?? [];
    list.push(guest);
    guestsByTable.set(guest.mesa_id, list);
  }

  const assignedGuests = guests.filter((guest) => guest.mesa_id).length;
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacidad, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Banquete"
        title="Mesas"
        description="Crea mesas, asigna invitados y visualiza la ocupación. Puedes ver el plano completo abajo."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tables.length} {plural(tables.length, "mesa")}</Badge>
            <Badge variant="secondary">{assignedGuests} {plural(assignedGuests, "asignado")}</Badge>
            <Badge variant={unassignedGuests.length > 0 ? "warning" : "success"}>
              {unassignedGuests.length} sin mesa
            </Badge>
            <Button asChild variant="outline">
              <Link href="/mesas/plano">
                <MapIcon className="size-4" />
                Ver plano
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard icon={Table2} value={tables.length} label="Mesas" note="Estructura creada para el banquete." />
        <StatCard icon={Users} value={totalCapacity} label="Capacidad" note="Sillas disponibles en total." />
        <StatCard
          icon={ArrowRightLeft}
          value={unassignedGuests.length}
          label="Sin asignar"
          note="Invitados listos para mover a una mesa."
          tone={unassignedGuests.length > 0 ? "warning" : "success"}
        />
      </div>

      <Card className="mb-6 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Crear mesa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTableAction} className="grid gap-4 lg:grid-cols-[1.1fr_0.5fr_1.4fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="table-new-nombre" required>Nombre</Label>
              <Input id="table-new-nombre" name="nombre" placeholder="Mesa 12 - Familia" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table-new-capacidad" required>Capacidad</Label>
              <Input id="table-new-capacidad" name="capacidad" type="number" min="1" defaultValue={8} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table-new-notas">Notas</Label>
              <Textarea id="table-new-notas" name="notas" placeholder="Familia cercana, niños, amigos..." />
            </div>
            <SubmitButton className="self-end" pendingText="Creando…">
              Crear mesa
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-primary" />
            Reasignar invitado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={moveGuestToTableAction} className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="table-reassign-guest">Invitado</Label>
              <Select id="table-reassign-guest" name="guest_id" defaultValue="">
                <option value="">Elige un invitado</option>
                {guests.map((guest) => (
                  <option key={guest.id} value={guest.id}>
                    {guest.nombre} {guest.apellidos} {guest.mesa_nombre ? `· ${guest.mesa_nombre}` : "· Sin mesa"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table-reassign-destino">Mesa destino</Label>
              <Select id="table-reassign-destino" name="mesa_id" defaultValue="">
                <option value="">Sin mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton className="self-end" pendingText="Moviendo…">
              Mover
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {tables.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="Sin mesas"
          text="Crea la primera mesa para empezar a distribuir a los invitados del banquete."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tables.map((table) => {
            const assigned = guestsByTable.get(table.id) ?? [];
            const used = assigned.length;
            const remaining = Math.max(table.capacidad - used, 0);
            const availableGuests = guests.filter((guest) => guest.mesa_id !== table.id);

            return (
              <Card key={table.id}>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        <Link className="transition-colors hover:text-primary" href={`/mesas/${table.id}`}>
                          {table.nombre}
                        </Link>
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {used}/{table.capacidad} ocupados · {remaining} libres
                      </p>
                    </div>
                    <Badge variant={remaining === 0 ? "danger" : remaining <= 2 ? "warning" : "success"}>
                      {remaining === 0 ? "Llena" : remaining <= 2 ? "Casi llena" : "Disponible"}
                    </Badge>
                  </div>

                  <OccupancyBar used={used} capacity={table.capacidad} />

                  <form action={updateTableAction} className="grid gap-3 lg:grid-cols-[1fr_0.5fr_1.6fr]">
                    <input name="id" type="hidden" value={table.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`table-${table.id}-nombre`} required>Nombre</Label>
                      <Input id={`table-${table.id}-nombre`} name="nombre" defaultValue={table.nombre} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`table-${table.id}-capacidad`} required>Capacidad</Label>
                      <Input id={`table-${table.id}-capacidad`} name="capacidad" type="number" min="1" defaultValue={table.capacidad} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`table-${table.id}-notas`}>Notas</Label>
                      <Textarea id={`table-${table.id}-notas`} name="notas" defaultValue={table.notas ?? ""} />
                    </div>
                    <SubmitButton className="lg:col-span-3" pendingText="Guardando…">
                      Guardar cambios
                    </SubmitButton>
                  </form>
                  <form action={deleteTableAction} className="flex justify-end">
                    <input name="id" type="hidden" value={table.id} />
                    <ConfirmSubmit confirmText={`¿Eliminar la mesa «${table.nombre}»? Esta acción no se puede deshacer.`}>
                      <Trash2 className="size-4" />
                      Eliminar mesa
                    </ConfirmSubmit>
                  </form>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form action={moveGuestToTableAction} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <input name="mesa_id" type="hidden" value={table.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`table-${table.id}-add-guest`}>Añadir invitado</Label>
                      <Select id={`table-${table.id}-add-guest`} name="guest_id" defaultValue="">
                        <option value="">Selecciona invitado</option>
                        {availableGuests.map((guest) => (
                          <option key={guest.id} value={guest.id}>
                            {guest.nombre} {guest.apellidos} {guest.mesa_nombre ? `· ${guest.mesa_nombre}` : ""}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <SubmitButton className="self-end" pendingText="Añadiendo…">
                      Añadir
                    </SubmitButton>
                  </form>

                  <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Invitados asignados</p>
                    {assigned.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nadie asignado todavía.</p>
                    ) : (
                      <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                        {assigned.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                              <span>
                                {guest.nombre} {guest.apellidos}
                              </span>
                            </div>
                            <form action={moveGuestToTableAction}>
                              <input name="guest_id" type="hidden" value={guest.id} />
                              <input name="mesa_id" type="hidden" value="" />
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
