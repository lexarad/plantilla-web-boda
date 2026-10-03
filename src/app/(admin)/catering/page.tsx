import Link from "next/link";
import { AlertTriangle, ChefHat, Download, Table2, UtensilsCrossed } from "lucide-react";
import { getCateringGuests } from "@/lib/data";
import { buildMenuStats } from "@/lib/catering-stats";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { PrintButton } from "@/components/print-button";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plural } from "@/lib/format";

export const metadata = { title: "Catering" };

export default async function CateringPage() {
  const guests = await getCateringGuests();
  const menuStats = buildMenuStats(guests);
  const withAllergies = guests.filter((guest) => guest.alergias_intolerancias);
  const total = guests.length;

  const groupedByMenu = new Map<string, typeof guests>();

  for (const option of menuChoiceOptions) {
    if (option.value === "pendiente") {
      continue;
    }

    const group = guests.filter((guest) => guest.menu_elegido === option.value);

    if (group.length > 0) {
      groupedByMenu.set(option.label, group);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catering"
        title="Resumen de menús"
        description="Cuenta de cada tipo de menú elegido por invitados confirmados, con alergias resaltadas y resumen por mesa."
        actions={
          <>
            <Badge variant="secondary">{total} confirmados</Badge>
            <Badge variant="outline">{withAllergies.length} con {plural(withAllergies.length, "alergia")}</Badge>
            <Button asChild variant="outline">
              <Link href="/catering/export">
                <Download className="size-4" />
                Exportar CSV
              </Link>
            </Button>
            <PrintButton label="Imprimir" />
          </>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Sin confirmados todavía"
          text="Aún no hay nada que hacer aquí: en cuanto un invitado confirme asistencia y elija menú desde su RSVP, aparecerá en este resumen."
        />
      ) : (
        <>
          <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {menuStats.map((stat) => {
              const pct = total > 0 ? Math.round((stat.count / total) * 100) : 0;
              return (
                <StatCard
                  key={stat.menu}
                  icon={ChefHat}
                  value={stat.count}
                  label={stat.label}
                  note={`${pct}% de los confirmados`}
                />
              );
            })}
          </section>

          {withAllergies.length > 0 && (
            <Card className="mb-6 border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <UtensilsCrossed className="size-4" />
                  Alergias e intolerancias ({withAllergies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invitado</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Menú</TableHead>
                      <TableHead>Alergias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withAllergies.map((guest) => {
                      const menuLabel = menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label ?? guest.menu_elegido;

                      return (
                        <TableRow key={guest.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                              <span className="font-medium">{`${guest.nombre} ${guest.apellidos}`}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{guest.mesa_nombre ?? "Sin mesa"}</TableCell>
                          <TableCell>{menuLabel}</TableCell>
                          <TableCell>
                            <Badge variant="warning" className="gap-1.5">
                              <AlertTriangle className="size-3" />
                              {guest.alergias_intolerancias}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Resumen por mesa */}
          {(() => {
            const byTable = new Map<string, typeof guests>();
            for (const guest of guests) {
              const key = guest.mesa_nombre ?? "Sin mesa";
              const list = byTable.get(key) ?? [];
              list.push(guest);
              byTable.set(key, list);
            }
            const tableEntries = Array.from(byTable.entries()).sort(([a], [b]) => a.localeCompare(b));
            if (tableEntries.length === 0) return null;

            return (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table2 className="size-4 text-primary" />
                    Resumen por mesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tableEntries.map(([tableName, tableGuests]) => {
                      const menuCounts = new Map<string, number>();
                      for (const guest of tableGuests) {
                        const label = menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label ?? guest.menu_elegido;
                        menuCounts.set(label, (menuCounts.get(label) ?? 0) + 1);
                      }
                      const allergyCount = tableGuests.filter((g) => g.alergias_intolerancias).length;
                      return (
                        <div
                          key={tableName}
                          className="hover-lift rounded-xl border border-border/60 bg-background/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-display text-lg leading-none">{tableName}</p>
                            <Badge variant="secondary">{tableGuests.length}</Badge>
                          </div>
                          <ul className="mt-3 space-y-1 text-xs">
                            {Array.from(menuCounts.entries()).map(([label, count]) => (
                              <li key={label} className="flex items-center justify-between text-muted-foreground">
                                <span>{label}</span>
                                <span className="font-semibold text-foreground tabular-nums">{count}</span>
                              </li>
                            ))}
                          </ul>
                          {allergyCount > 0 ? (
                            <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-warning">
                              <AlertTriangle className="size-3" />
                              {allergyCount} con alergia{allergyCount > 1 ? "s" : ""}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {Array.from(groupedByMenu.entries()).map(([menuLabel, groupGuests]) => (
            <Card className="mb-4" key={menuLabel}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ChefHat className="size-4 text-primary" />
                    {menuLabel}
                  </span>
                  <Badge variant="secondary">{groupGuests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invitado</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Alergias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
                            <span className="font-medium">{`${guest.nombre} ${guest.apellidos}`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{guest.grupo ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{guest.mesa_nombre ?? "Sin mesa"}</TableCell>
                        <TableCell className="text-muted-foreground">{guest.necesita_autobus ? "Sí" : "No"}</TableCell>
                        <TableCell className={guest.alergias_intolerancias ? "font-semibold text-warning" : "text-muted-foreground"}>
                          {guest.alergias_intolerancias ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
