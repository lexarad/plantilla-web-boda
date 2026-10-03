import { CircleDollarSign, TrendingDown, TrendingUp, Wallet, Trash2 } from "lucide-react";
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from "@/app/(admin)/presupuesto/actions";
import { getBudgetItems } from "@/lib/data";
import { formatCurrency, formatDate, paymentLabel } from "@/lib/format";
import { DonutChart } from "@/components/donut-chart";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Presupuesto" };

const paymentOptions = [
  ["pendiente", "Pendiente"],
  ["parcial", "Parcial"],
  ["pagado", "Pagado"]
];

export default async function BudgetPage() {
  const items = await getBudgetItems();
  const estimated = items.reduce((total, item) => total + item.coste_estimado, 0);
  const spent = items.reduce((total, item) => total + item.coste_real, 0);
  const deviation = spent - estimated;
  const paid = items.filter((item) => item.estado_pago === "pagado").reduce((sum, item) => sum + item.coste_real, 0);
  const pending = items.filter((item) => item.estado_pago === "pendiente").reduce((sum, item) => sum + item.coste_estimado, 0);

  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = byCategory.get(item.categoria) ?? [];
    list.push(item);
    byCategory.set(item.categoria, list);
  }
  const categoryEntries = Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <AdminPageHeader
        eyebrow="Control financiero"
        title="Presupuesto"
        description="Comparativa entre lo previsto y lo gastado, agrupado por categoría y con desviaciones marcadas en color."
        actions={
          <>
            <Badge variant="secondary">Previsto {formatCurrency(estimated)}</Badge>
            <Badge variant={deviation > 0 ? "danger" : deviation < 0 ? "success" : "outline"}>
              Real {formatCurrency(spent)}
            </Badge>
          </>
        }
      />

      {items.length > 0 && (
        <>
          <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CircleDollarSign} value={formatCurrency(estimated)} label="Total previsto" />
            <StatCard
              icon={deviation > 0 ? TrendingUp : TrendingDown}
              value={formatCurrency(spent)}
              label="Gasto real"
              tone={deviation > 0 ? "destructive" : "success"}
              note={deviation !== 0 ? `${deviation > 0 ? "+" : ""}${formatCurrency(deviation)} vs. previsto` : "Sin desviación"}
            />
            <StatCard icon={Wallet} value={formatCurrency(paid)} label="Ya pagado" tone="info" />
            <StatCard icon={CircleDollarSign} value={formatCurrency(pending)} label="Pendiente pago" tone="warning" />
          </section>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="size-4 text-primary" />
                Por categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
                {(() => {
                  const palette = [
                    "hsl(163 34% 23%)",
                    "hsl(35 50% 38%)",
                    "hsl(10 39% 60%)",
                    "hsl(207 35% 50%)",
                    "hsl(280 30% 55%)",
                    "hsl(143 35% 45%)",
                    "hsl(22 55% 55%)",
                    "hsl(45 60% 55%)"
                  ];
                  const slices = categoryEntries.map(([cat, items], idx) => ({
                    label: cat,
                    value: items.reduce((s, i) => s + i.coste_estimado, 0),
                    color: palette[idx % palette.length]
                  }));
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <DonutChart
                        data={slices}
                        size={200}
                        thickness={30}
                        centerLabel="Previsto"
                        centerValue={formatCurrency(estimated)}
                      />
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {slices.map((slice) => (
                          <div key={slice.label} className="flex items-center gap-2">
                            <span className="size-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                            <span className="font-medium">{slice.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              <div className="grid gap-3">
                {categoryEntries.map(([cat, catItems]) => {
                  const catEst = catItems.reduce((s, i) => s + i.coste_estimado, 0);
                  const catReal = catItems.reduce((s, i) => s + i.coste_real, 0);
                  const catDev = catReal - catEst;
                  const pct = estimated > 0 ? Math.round((catEst / estimated) * 100) : 0;
                  return (
                    <div key={cat} className="grid gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat}</span>
                        <span className="flex items-center gap-3 text-muted-foreground">
                          <span>{formatCurrency(catReal)} / {formatCurrency(catEst)}</span>
                          {catDev !== 0 && (
                            <span className={catDev > 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>
                              {catDev > 0 ? "+" : ""}{formatCurrency(catDev)}
                            </span>
                          )}
                          <span className="text-xs">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${catDev > 0 ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-primary" />
            Nuevo gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBudgetAction} className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="budget-new-categoria" required>Categoría</Label>
              <Input id="budget-new-categoria" name="categoria" placeholder="Catering" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-concepto" required>Concepto</Label>
              <Input id="budget-new-concepto" name="concepto" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-proveedor">Proveedor</Label>
              <Input id="budget-new-proveedor" name="proveedor" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-estado">Estado pago</Label>
              <Select id="budget-new-estado" name="estado_pago" defaultValue="pendiente">
                {paymentOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-estimado">Coste estimado</Label>
              <Input id="budget-new-estimado" min="0" name="coste_estimado" step="0.01" type="number" defaultValue="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-real">Coste real</Label>
              <Input id="budget-new-real" min="0" name="coste_real" step="0.01" type="number" defaultValue="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-fecha">Fecha pago</Label>
              <Input id="budget-new-fecha" name="fecha_pago" type="date" />
            </div>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="budget-new-notas">Notas</Label>
              <Textarea id="budget-new-notas" name="notas" />
            </div>
            <SubmitButton className="lg:col-span-4" pendingText="Creando…">
              Crear gasto
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          title="Sin gastos"
          text="Añade el primer gasto con el formulario de arriba para empezar a controlar desviaciones."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const itemDeviation = item.coste_real - item.coste_estimado;
            return (
              <Card key={item.id}>
                <CardContent className="grid gap-4 p-5">
                  <form action={updateBudgetAction} className="grid gap-4">
                    <input name="id" type="hidden" value={item.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-categoria`} required>Categoría</Label>
                        <Input id={`budget-${item.id}-categoria`} name="categoria" defaultValue={item.categoria} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-concepto`} required>Concepto</Label>
                        <Input id={`budget-${item.id}-concepto`} name="concepto" defaultValue={item.concepto} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`budget-${item.id}-proveedor`}>Proveedor</Label>
                      <Input id={`budget-${item.id}-proveedor`} name="proveedor" defaultValue={item.proveedor ?? ""} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-estimado`}>Estimado</Label>
                        <Input id={`budget-${item.id}-estimado`} min="0" name="coste_estimado" step="0.01" type="number" defaultValue={String(item.coste_estimado)} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-real`}>Real</Label>
                        <Input id={`budget-${item.id}-real`} min="0" name="coste_real" step="0.01" type="number" defaultValue={String(item.coste_real)} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-estado`}>Estado pago</Label>
                        <Select id={`budget-${item.id}-estado`} name="estado_pago" defaultValue={item.estado_pago}>
                          {paymentOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-fecha`}>Fecha pago</Label>
                        <Input id={`budget-${item.id}-fecha`} name="fecha_pago" type="date" defaultValue={item.fecha_pago ?? ""} />
                        <p className="text-xs text-muted-foreground">{formatDate(item.fecha_pago)}</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`budget-${item.id}-notas`}>Notas</Label>
                        <Textarea id={`budget-${item.id}-notas`} name="notas" defaultValue={item.notas ?? ""} rows={2} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{paymentLabel(item.estado_pago)}</span>
                        {itemDeviation !== 0 ? (
                          <span className={itemDeviation > 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>
                            {itemDeviation > 0 ? "+" : ""}{formatCurrency(itemDeviation)} vs. previsto
                          </span>
                        ) : null}
                      </span>
                      <SubmitButton size="sm" pendingText="Guardando…">
                        Guardar cambios
                      </SubmitButton>
                    </div>
                  </form>
                  <form action={deleteBudgetAction} className="flex justify-end border-t border-border/60 pt-4">
                    <input name="id" type="hidden" value={item.id} />
                    <ConfirmSubmit
                      size="sm"
                      confirmText={`¿Eliminar «${item.concepto}»? Esta acción no se puede deshacer.`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Eliminar gasto
                    </ConfirmSubmit>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
