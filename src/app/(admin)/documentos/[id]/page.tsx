import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Download, FileText, FolderOpen, Info } from "lucide-react";
import { iconForMime } from "@/app/(admin)/documentos/mime-icon";
import { getAuditEvents, getDocumentById } from "@/lib/data";
import { auditActionLabel, formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Documento" };

function getAuditVariant(action: string) {
  if (action === "deleted") {
    return "danger";
  }

  if (action === "updated") {
    return "warning";
  }

  return "success";
}

export default async function DocumentDetailPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [document, auditEvents] = await Promise.all([getDocumentById(id), getAuditEvents("documento", id)]);

  if (!document) {
    notFound();
  }

  const { Icon: DocIcon, className: docIconClassName } = iconForMime(document.mime_type, document.archivo_nombre);

  return (
    <>
      <AdminPageHeader
        eyebrow="Archivo privado"
        title={document.nombre}
        actions={
          <>
            <Badge variant="secondary">{document.tipo}</Badge>
            <Badge variant="secondary">{formatBytes(document.tamano_bytes)}</Badge>
            <Button asChild variant="outline">
              <Link href="/documentos">
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
            <span className={`flex size-14 items-center justify-center rounded-2xl ${docIconClassName}`}>
              <DocIcon className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary/60">{document.tipo}</p>
              <p className="font-display text-3xl leading-tight truncate">{document.nombre}</p>
              <p className="mt-0.5 text-sm text-muted-foreground truncate">
                {document.archivo_nombre} · {formatBytes(document.tamano_bytes)}
              </p>
            </div>
            {document.download_url ? (
              <Button asChild className="ml-auto">
                <a href={document.download_url} rel="noreferrer" target="_blank" download={document.archivo_nombre}>
                  <Download className="size-4" />
                  Descargar
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Detalle del documento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{document.archivo_nombre}</Badge>
                {document.mime_type ? <Badge variant="outline">{document.mime_type}</Badge> : null}
                <Badge variant="outline">Subido {formatDate(document.created_at)}</Badge>
              </div>
              <p className="text-muted-foreground">{document.notas ?? "Sin notas."}</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-card/70 p-4 text-sm">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-4 text-primary" />
                Proveedor: {document.proveedor_nombre ?? "Sin proveedor"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Creado: {formatDateTime(document.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Info className="size-4 text-primary" />
                Actualizado: {formatDateTime(document.updated_at)}
              </div>
            </div>

            {document.download_url ? (
              <Button asChild className="w-full" variant="outline">
                <a href={document.download_url} rel="noreferrer" target="_blank" download={document.archivo_nombre}>
                  <Download className="size-4" />
                  Descargar documento
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid gap-2 rounded-2xl border border-border bg-background/70 p-4">
              <p className="font-semibold">Línea temporal</p>
              <p className="text-muted-foreground">Creado {formatDateTime(document.created_at)}</p>
              <p className="text-muted-foreground">Última modificación {formatDateTime(document.updated_at)}</p>
            </div>
            <div className="grid gap-2 rounded-2xl border border-border bg-card/70 p-4">
              <p className="font-semibold">Resumen técnico</p>
              <p className="text-muted-foreground">Tipo: {document.tipo}</p>
              <p className="text-muted-foreground">Archivo: {document.archivo_nombre}</p>
              <p className="text-muted-foreground">Tamaño: {formatBytes(document.tamano_bytes)}</p>
              <p className="text-muted-foreground">Proveedor: {document.proveedor_nombre ?? "Sin proveedor"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/documentos">Abrir listado</Link>
          </Button>
          {document.proveedor_id ? (
            <Button asChild variant="outline">
              <Link href={`/proveedores/${document.proveedor_id}`}>Ver proveedor</Link>
            </Button>
          ) : null}
          {document.download_url ? (
            <Button asChild variant="outline">
              <a href={document.download_url} rel="noreferrer" target="_blank" download={document.archivo_nombre}>
                Descargar documento
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historial de cambios</CardTitle>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <EmptyState icon={FileText} title="Sin eventos" text="Todavía no hay cambios registrados para este documento." />
          ) : (
            <ol className="relative grid gap-3 border-l-2 border-primary/15 pl-5">
              {auditEvents.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-3 flex size-6 items-center justify-center rounded-full border-2 border-primary/30 bg-background">
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
