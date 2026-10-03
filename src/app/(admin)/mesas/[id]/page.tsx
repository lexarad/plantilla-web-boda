import Link from "next/link";
import { ArrowLeft, Link2, Map as MapIcon, Table2, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { ProgressRing } from "@/components/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableDetailEditor } from "@/components/table-detail-editor";
import { getGuests, getTableById, getTables } from "@/lib/data";

export const metadata = { title: "Mesa" };

export default async function TableDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [table, guests, allTables] = await Promise.all([
    getTableById(id),
    getGuests(),
    getTables()
  ]);

  if (!table) {
    return (
      <div className="grid gap-4">
        <EmptyState icon={Table2} title="Mesa no encontrada" text="La mesa solicitada no existe o ya fue eliminada." />
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/mesas">
              <ArrowLeft className="size-4" />
              Volver a mesas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const assignedGuests = guests.filter((guest) => guest.mesa_id === table.id);
  const usedSeats = assignedGuests.length;
  const freeSeats = Math.max(table.capacidad - usedSeats, 0);
  const otherTables = allTables.filter((t) => t.id !== table.id);

  return (
    <>
      <AdminPageHeader
        eyebrow="Mesa"
        title={table.nombre}
        description={`Capacidad ${table.capacidad} · ${freeSeats} libres · arrastra invitados para asignar`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{usedSeats}/{table.capacidad} ocupados</Badge>
            <Badge variant={freeSeats === 0 ? "danger" : freeSeats <= 2 ? "warning" : "success"}>
              {freeSeats === 0 ? "Llena" : freeSeats <= 2 ? "Casi llena" : "Disponible"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/mesas/plano">
                <MapIcon className="size-4" />
                Plano global
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/mesas">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <ProgressRing
              value={usedSeats}
              total={table.capacidad}
              tone={freeSeats === 0 ? "success" : freeSeats <= 2 ? "warning" : "primary"}
              size={70}
              thickness={7}
              sublabel={`${usedSeats}/${table.capacidad}`}
            />
            <div className="text-sm">
              <p className="text-muted-foreground">Capacidad</p>
              <p className="font-display text-xl leading-none">{table.capacidad}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{freeSeats} libres</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notas</p>
            <p className="mt-1 text-sm leading-6">{table.notas || "Sin notas"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menús asignados</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {assignedGuests.length > 0 ? (
                Array.from(new Set(assignedGuests.map((g) => g.menu_elegido))).map((m) => (
                  <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Sin asignados</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Editor visual de asientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableDetailEditor table={table} guests={guests} otherTables={otherTables} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/mesas">Abrir listado</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/invitados">Ver invitados</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/autobuses">Ver autobuses</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
