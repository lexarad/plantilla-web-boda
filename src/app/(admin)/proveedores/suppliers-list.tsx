"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Eye, Globe, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { deleteSupplierAction, updateSupplierAction } from "@/app/(admin)/proveedores/actions";
import {
  statusStepIndex,
  supplierStatusLabels,
  supplierStatusOptions
} from "@/app/(admin)/proveedores/filters";
import { formatPrecioProveedor } from "@/lib/format";
import { isSupplierUnavailable } from "@/lib/supplier-status";
import type { Supplier, SupplierStatus } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function getSupplierVariant(status: SupplierStatus) {
  if (status === "pagado") {
    return "success";
  }

  if (status === "reservado" || status === "cotizado") {
    return "warning";
  }

  return "secondary";
}

function normalizeWeb(web: string) {
  return /^https?:\/\//i.test(web) ? web : `https://${web}`;
}

function SupplierProgressBar({ status }: { status: SupplierStatus }) {
  const steps = ["idea", "contactado", "cotizado", "reservado", "pagado"] as const;
  const currentIndex = statusStepIndex[status];
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => (
        <div
          key={step}
          className={
            "h-1.5 flex-1 rounded-full transition-colors " +
            (index <= currentIndex
              ? step === "pagado"
                ? "bg-success"
                : step === "reservado" || step === "cotizado"
                ? "bg-warning"
                : "bg-primary"
              : "bg-muted")
          }
          title={supplierStatusLabels[step]}
        />
      ))}
    </div>
  );
}

// Pill de contacto clicable: mailto / tel / web en pestaña nueva. min-h-11 = 44px (target táctil móvil).
function ContactLink({ href, external, children }: { href: string; external?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {children}
    </a>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [editing, setEditing] = useState(false);
  const unavailable = isSupplierUnavailable(supplier.notas);
  const fieldId = (name: string) => `${supplier.id}-${name}`;

  return (
    <Card className={"hover-lift " + (unavailable ? "opacity-60" : "")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="size-5" />
            </span>
            <div>
              <CardTitle>{supplier.nombre}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">{supplier.tipo}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {unavailable ? <Badge variant="danger">No disponible</Badge> : null}
            <Badge variant={getSupplierVariant(supplier.estado)}>{supplierStatusLabels[supplier.estado]}</Badge>
          </div>
        </div>
        <SupplierProgressBar status={supplier.estado} />
      </CardHeader>
      <CardContent className="grid gap-4">
        {editing ? (
          <form action={updateSupplierAction} className="grid gap-4 lg:grid-cols-4">
            <input name="id" type="hidden" value={supplier.id} />
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor={fieldId("nombre")} required>Nombre</Label>
              <Input id={fieldId("nombre")} name="nombre" defaultValue={supplier.nombre} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("tipo")} required>Tipo</Label>
              <Input id={fieldId("tipo")} name="tipo" defaultValue={supplier.tipo} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("estado")}>Estado</Label>
              <Select id={fieldId("estado")} name="estado" defaultValue={supplier.estado}>
                {supplierStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("email")}>Correo</Label>
              <Input id={fieldId("email")} name="email" type="email" defaultValue={supplier.email ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("telefono")}>Teléfono</Label>
              <Input id={fieldId("telefono")} name="telefono" defaultValue={supplier.telefono ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("web")}>Web</Label>
              <Input id={fieldId("web")} name="web" defaultValue={supplier.web ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fieldId("precio")}>Precio</Label>
              <Input
                id={fieldId("precio")}
                name="precio"
                min="0"
                step="0.01"
                type="number"
                defaultValue={String(supplier.precio)}
              />
            </div>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor={fieldId("notas")}>Notas</Label>
              <Textarea id={fieldId("notas")} name="notas" defaultValue={supplier.notas ?? ""} />
            </div>
            <div className="flex flex-col gap-2 lg:col-span-4 sm:flex-row">
              <SubmitButton className="flex-1" pendingText="Guardando…">
                Guardar cambios
              </SubmitButton>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid gap-3 rounded-2xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formatPrecioProveedor(supplier.precio)}</Badge>
                {supplier.email ? (
                  <ContactLink href={`mailto:${supplier.email}`}>
                    <Mail className="size-3.5" aria-hidden="true" />
                    {supplier.email}
                  </ContactLink>
                ) : null}
                {supplier.telefono ? (
                  <ContactLink href={`tel:${supplier.telefono}`}>
                    <Phone className="size-3.5" aria-hidden="true" />
                    {supplier.telefono}
                  </ContactLink>
                ) : null}
                {supplier.web ? (
                  <ContactLink href={normalizeWeb(supplier.web)} external>
                    <Globe className="size-3.5" aria-hidden="true" />
                    {supplier.web}
                  </ContactLink>
                ) : null}
              </div>
              <p className="whitespace-pre-line">{supplier.notas ?? "Sin notas"}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="flex-1" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/proveedores/${supplier.id}`}>
                  <Eye className="size-4" />
                  Ver historial
                </Link>
              </Button>
              <form action={deleteSupplierAction} className="flex flex-1">
                <input name="id" type="hidden" value={supplier.id} />
                <ConfirmSubmit
                  className="w-full"
                  confirmText={`¿Eliminar el proveedor «${supplier.nombre}»? Esta acción no se puede deshacer.`}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </ConfirmSubmit>
              </form>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {suppliers.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
}
