import Link from "next/link";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { createSupplierAction } from "@/app/(admin)/proveedores/actions";
import {
  filterAndSortSuppliers,
  getSupplierTypes,
  readSupplierFilters,
  supplierSortOptions,
  supplierStatusOptions
} from "@/app/(admin)/proveedores/filters";
import { getSuppliers } from "@/lib/data";
import { formatCurrency, plural } from "@/lib/format";
import { SuppliersList } from "@/app/(admin)/proveedores/suppliers-list";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Proveedores" };

export default async function SuppliersPage({
  searchParams
}: {
  searchParams?: Promise<{
    estado?: string | string[];
    tipo?: string | string[];
    orden?: string | string[];
    ocultar?: string | string[];
  }>;
}) {
  const suppliers = await getSuppliers();
  const params = (await searchParams) ?? {};
  const filters = readSupplierFilters(params);
  const supplierTypes = getSupplierTypes(suppliers);
  const visibleSuppliers = filterAndSortSuppliers(suppliers, params);

  // El total agregado suma importes reales: aquí un precio 0 sí cuenta como 0 (F1).
  const totalBudget = suppliers.reduce((sum, supplier) => sum + supplier.precio, 0);
  const reservedSuppliers = suppliers.filter(
    (supplier) => supplier.estado === "reservado" || supplier.estado === "pagado"
  ).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Proveedores"
        title="Contratos y contactos"
        description="Lleva el estado de cada proveedor (idea → contactado → cotizado → reservado → pagado) y centraliza el contacto."
        actions={
          <>
            <Badge variant="secondary">{suppliers.length} {plural(suppliers.length, "proveedor", "proveedores")}</Badge>
            <Badge variant="secondary">{reservedSuppliers} {plural(reservedSuppliers, "reservado")}</Badge>
            <Badge variant="secondary">{formatCurrency(totalBudget)}</Badge>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Nuevo proveedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplierAction} className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="nuevo-nombre" required>Nombre</Label>
              <Input id="nuevo-nombre" name="nombre" placeholder="Casa del Lago" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-tipo" required>Tipo</Label>
              <Input id="nuevo-tipo" name="tipo" placeholder="Catering" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-estado">Estado</Label>
              <Select id="nuevo-estado" name="estado" defaultValue="idea">
                {supplierStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-email">Correo</Label>
              <Input id="nuevo-email" name="email" type="email" placeholder="contacto@proveedor.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-telefono">Teléfono</Label>
              <Input id="nuevo-telefono" name="telefono" placeholder="600 000 000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-web">Web</Label>
              <Input id="nuevo-web" name="web" placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nuevo-precio">Precio</Label>
              <Input id="nuevo-precio" name="precio" min="0" step="0.01" type="number" defaultValue={0} />
            </div>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="nuevo-notas">Notas</Label>
              <Textarea id="nuevo-notas" name="notas" placeholder="Condiciones, disponibilidad, observaciones..." />
            </div>
            <SubmitButton className="w-full lg:col-span-4" pendingText="Creando…">
              Crear proveedor
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Sin proveedores"
          text="Crea el primer contacto con el formulario de arriba para llevar control de presupuestos, estados y notas."
        />
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-primary" />
                Filtrar y ordenar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/proveedores" method="get" className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="grid gap-2">
                  <Label htmlFor="filtro-estado">Estado</Label>
                  <Select id="filtro-estado" name="estado" defaultValue={filters.estado}>
                    <option value="todos">Todos los estados</option>
                    {supplierStatusOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filtro-tipo">Tipo</Label>
                  <Select id="filtro-tipo" name="tipo" defaultValue={filters.tipo}>
                    <option value="todos">Todos los tipos</option>
                    {supplierTypes.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filtro-orden">Ordenar por</Label>
                  <Select id="filtro-orden" name="orden" defaultValue={filters.orden}>
                    {supplierSortOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1">
                    Aplicar
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/proveedores">Limpiar</Link>
                  </Button>
                </div>
                <CheckboxField
                  className="lg:col-span-4"
                  name="ocultar"
                  value="1"
                  defaultChecked={filters.ocultar}
                >
                  Ocultar no disponibles
                </CheckboxField>
              </form>
            </CardContent>
          </Card>

          {visibleSuppliers.length === 0 ? (
            <EmptyState
              icon={BriefcaseBusiness}
              title="Ningún proveedor con este filtro"
              text="Cambia el estado o el tipo, o quita «Ocultar no disponibles», para ver más proveedores."
            />
          ) : (
            <SuppliersList suppliers={visibleSuppliers} />
          )}
        </>
      )}
    </>
  );
}
