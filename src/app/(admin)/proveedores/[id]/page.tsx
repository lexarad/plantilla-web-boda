import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Download, ExternalLink, FileText, MapPin, Mail, Phone, Globe } from "lucide-react";
import { getAuditEvents, getDocuments, getSupplierById } from "@/lib/data";
import { auditActionLabel, estadoProveedorLabel, formatBytes, formatDate, formatDateTime, formatPrecioProveedor, plural } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Proveedor" };

function getAuditVariant(action: string) {
  if (action === "deleted") {
    return "danger";
  }

  if (action === "updated") {
    return "warning";
  }

  return "success";
}

export default async function SupplierDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [supplier, documents, auditEvents] = await Promise.all([getSupplierById(id), getDocuments(), getAuditEvents("proveedor", id)]);

  if (!supplier) {
    notFound();
  }

  const supplierDocuments = documents.filter((document) => document.proveedor_id === supplier.id);
  const totalValue = supplierDocuments.reduce((sum, document) => sum + document.tamano_bytes, 0);
  const latestUpdate = supplierDocuments[0]?.updated_at ?? supplier.updated_at;

  return (
    <>
      <AdminPageHeader
        eyebrow="Proveedores"
        title={supplier.nombre}
        actions={
          <>
            <Badge variant="secondary">{supplier.tipo}</Badge>
            <Badge variant="secondary">{estadoProveedorLabel(supplier.estado)}</Badge>
            <Badge variant="secondary">{formatPrecioProveedor(supplier.precio)}</Badge>
            <Button asChild variant="outline">
              <Link href="/proveedores">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>
          </>
        }
      />

      <Card className="mb-6 overflow-hidden border-border/60">
        <CardContent className="relative p-5">
          <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary/60">{supplier.tipo}</p>
              <p className="font-display text-3xl leading-tight">{supplier.nombre}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatPrecioProveedor(supplier.precio)} · {estadoProveedorLabel(supplier.estado)}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Correo"
                  title={supplier.email}
                >
                  <Mail className="size-4" />
                </a>
              ) : null}
              {supplier.telefono ? (
                <a
                  href={`tel:${supplier.telefono}`}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Teléfono"
                  title={supplier.telefono}
                >
                  <Phone className="size-4" />
                </a>
              ) : null}
              {supplier.web ? (
                <a
                  href={supplier.web}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Web"
                  title={supplier.web}
                >
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del proveedor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{formatPrecioProveedor(supplier.precio)}</Badge>
                <Badge variant="outline">Creado {formatDate(supplier.created_at)}</Badge>
                <Badge variant="outline">Actualizado {formatDate(supplier.updated_at)}</Badge>
              </div>
              <p className="whitespace-pre-line text-muted-foreground">{supplier.notas ?? "Sin notas registradas."}</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-card/70 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                {supplier.email ?? "Sin correo"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                {supplier.telefono ?? "Sin teléfono"}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                {supplier.web ?? "Sin web"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Estado administrativo: {estadoProveedorLabel(supplier.estado)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de contratos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <Badge variant="secondary">{supplierDocuments.length} {plural(supplierDocuments.length, "contrato vinculado", "contratos vinculados")}</Badge>
              <p className="text-muted-foreground">Historial construido a partir de los documentos asociados a este proveedor.</p>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border bg-card/70 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Tamaño acumulado</span>
                <span className="font-semibold">{formatBytes(totalValue)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Último movimiento</span>
                <span className="font-semibold">{formatDateTime(latestUpdate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/proveedores">Abrir listado</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/documentos">Ver documentos</Link>
          </Button>
          {supplier.email ? (
            <Button asChild variant="outline">
              <a href={`mailto:${supplier.email}`}>Enviar correo</a>
            </Button>
          ) : null}
          {supplier.web ? (
            <Button asChild variant="outline">
              <a href={supplier.web} rel="noreferrer" target="_blank">
                Abrir web
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Histórico de contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplierDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin contratos vinculados"
              text="Sube documentos y asignalos a este proveedor para construir su historial."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {supplierDocuments.map((document) => (
                <div key={document.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{document.nombre}</p>
                      <p className="text-sm text-muted-foreground">{document.archivo_nombre}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{document.tipo}</Badge>
                      <Badge variant="outline">{formatBytes(document.tamano_bytes)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Creado: {formatDateTime(document.created_at)}</p>
                    <p>Actualizado: {formatDateTime(document.updated_at)}</p>
                    <p>Storage: {document.storage_path}</p>
                    {document.notas ? <p>{document.notas}</p> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {document.download_url ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={document.download_url} rel="noreferrer" target="_blank" download={document.archivo_nombre}>
                          <Download className="size-4" />
                          Descargar
                        </a>
                      </Button>
                    ) : null}
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/documentos/${document.id}`}>Ver documento</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Historial de cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <EmptyState icon={FileText} title="Sin eventos" text="Todavía no hay cambios registrados para este proveedor." />
          ) : (
            <ol className="relative grid gap-3 border-l-2 border-primary/15 pl-5">
              {auditEvents.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-3 flex size-6 items-center justify-center rounded-full border-2 border-primary/30 bg-card">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm hover-lift">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="mt-1 text-muted-foreground">{event.details ?? "Sin detalles."}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getAuditVariant(event.action)}>{auditActionLabel(event.action)}</Badge>
                        <Badge variant="outline">{formatDateTime(event.created_at)}</Badge>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
