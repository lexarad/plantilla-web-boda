import Link from "next/link";
import { ArrowLeft, ChefHat, Table2, Users } from "lucide-react";
import { getGuests, getTables } from "@/lib/data";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { rsvpLabel } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeatingPlanEditor, SeatingPlanLegend } from "@/components/seating-plan-editor";

export const metadata = { title: "Plano de mesas" };

type SearchParams = Promise<{ vista?: string }>;

export default async function SeatingPlanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = params.vista === "imprimir" ? "imprimir" : "editor";

  const [guests, tables] = await Promise.all([getGuests(), getTables()]);

  const guestsByTable = new Map<string, typeof guests>();
  const unassigned = guests.filter((g) => !g.mesa_id);

  for (const guest of guests) {
    if (!guest.mesa_id) continue;
    const list = guestsByTable.get(guest.mesa_id) ?? [];
    list.push(guest);
    guestsByTable.set(guest.mesa_id, list);
  }

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacidad, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Mesas"
        title="Plano de distribución"
        description="Arrastra invitados entre mesas o usa la vista imprimible para llevar al banquete."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {tables.length} mesas · {totalCapacity} asientos
            </Badge>
            <Badge variant={unassigned.length > 0 ? "warning" : "success"}>
              {unassigned.length > 0 ? `${unassigned.length} sin mesa` : "Todos asignados"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/mesas">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
            {mode === "editor" ? <PrintButton label="Imprimir" /> : null}
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-full border border-border/60 bg-card/85 p-1 shadow-sm backdrop-blur print:hidden">
        <Link
          href="/mesas/plano"
          className={
            mode === "editor"
              ? "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
              : "rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          }
        >
          Editor visual
        </Link>
        <Link
          href="/mesas/plano?vista=imprimir"
          className={
            mode === "imprimir"
              ? "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
              : "rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          }
        >
          Vista imprimible
        </Link>
      </div>

      {mode === "editor" ? (
        <>
          <SeatingPlanEditor guests={guests} tables={tables} />

          <Card className="mt-6">
            <CardContent className="py-4">
              <SeatingPlanLegend />
            </CardContent>
          </Card>

          <Card className="mt-4 print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="size-4 text-primary" />
                Resumen de menús asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-sm">
                {menuChoiceOptions
                  .filter((o) => o.value !== "pendiente")
                  .map((option) => {
                    const count = guests.filter((g) => g.menu_elegido === option.value && g.mesa_id).length;
                    if (count === 0) return null;
                    return (
                      <div
                        key={option.value}
                        className="flex items-center justify-between rounded-md border border-border bg-background/70 px-3 py-2"
                      >
                        <span>{option.label}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    );
                  })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Solo cuenta invitados ya asignados a una mesa.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <PrintView guests={guests} tables={tables} guestsByTable={guestsByTable} unassigned={unassigned} />
      )}
    </>
  );
}

function PrintView({
  tables,
  guestsByTable,
  unassigned
}: {
  guests: Awaited<ReturnType<typeof getGuests>>;
  tables: Awaited<ReturnType<typeof getTables>>;
  guestsByTable: Map<string, Awaited<ReturnType<typeof getGuests>>>;
  unassigned: Awaited<ReturnType<typeof getGuests>>;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
        {tables.map((table) => {
          const assigned = guestsByTable.get(table.id) ?? [];
          const free = Math.max(table.capacidad - assigned.length, 0);
          const full = free === 0;

          return (
            <Card key={table.id} className="break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-base">
                    <Table2 className="size-4 text-primary" />
                    {table.nombre}
                  </span>
                  <Badge variant={full ? "success" : free <= 2 ? "warning" : "secondary"}>
                    {assigned.length}/{table.capacidad}
                  </Badge>
                </CardTitle>
                {table.notas && <p className="text-xs text-muted-foreground">{table.notas}</p>}
              </CardHeader>
              <CardContent>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin invitados asignados</p>
                ) : (
                  <ol className="grid gap-1.5">
                    {assigned.map((guest, index) => {
                      const menuLabel = menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label;
                      return (
                        <li key={guest.id} className="flex items-start justify-between gap-2 text-sm">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0 text-xs text-muted-foreground w-5">{index + 1}.</span>
                            <span className="font-medium truncate">
                              {guest.nombre} {guest.apellidos}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {guest.alergias_intolerancias && (
                              <span className="rounded bg-warning/15 px-1 py-0.5 text-[10px] font-semibold text-warning">⚠</span>
                            )}
                            <span className="text-xs text-muted-foreground">{menuLabel}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {free > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {free} {free === 1 ? "asiento libre" : "asientos libres"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <Card className="mt-6 border-warning/30 bg-warning/5 break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Users className="size-4" />
              Sin mesa asignada ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {unassigned.map((guest) => {
                const menuLabel = menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label;
                return (
                  <div key={guest.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {guest.nombre} {guest.apellidos}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Menú: {menuLabel} · RSVP: {rsvpLabel(guest.confirmacion_asistencia)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
