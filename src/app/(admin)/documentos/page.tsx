import Link from "next/link";
import { Eye, FileText, Plus, Trash2 } from "lucide-react";
import { createDocumentAction, deleteDocumentAction, updateDocumentAction } from "@/app/(admin)/documentos/actions";
import { iconForMime } from "@/app/(admin)/documentos/mime-icon";
import { getDocuments, getSuppliers } from "@/lib/data";
import { formatBytes, plural } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Documentos" };

export default async function DocumentsPage() {
  const [documents, suppliers] = await Promise.all([getDocuments(), getSuppliers()]);
  const totalSize = documents.reduce((sum, document) => sum + document.tamano_bytes, 0);
  const linkedDocuments = documents.filter((document) => document.proveedor_id).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Archivo privado"
        title="Documentos"
        description="Contratos, facturas, presupuestos e imágenes vinculados a cada proveedor. Solo accesibles desde el panel."
        actions={
          <>
            <Badge variant="secondary">{documents.length} {plural(documents.length, "documento")}</Badge>
            <Badge variant="secondary">{linkedDocuments} vinculados</Badge>
            <Badge variant="secondary">{formatBytes(totalSize)}</Badge>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Subir documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDocumentAction} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="new-nombre" required>Nombre visible</Label>
              <Input id="new-nombre" name="nombre" placeholder="Contrato catering" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-tipo" required>Tipo</Label>
              <Input id="new-tipo" name="tipo" placeholder="Contrato" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-proveedor">Proveedor</Label>
              <Select id="new-proveedor" name="proveedor_id" defaultValue="">
                <option value="">Sin proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="new-archivo" required>Archivo</Label>
              <Input
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.zip"
                id="new-archivo"
                name="archivo"
                type="file"
                required
              />
            </div>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="new-notas">Notas</Label>
              <Textarea id="new-notas" name="notas" placeholder="Condiciones, versión, próximo paso…" />
            </div>
            <SubmitButton className="lg:col-span-4" pendingText="Subiendo…">
              Subir documento
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin documentos"
          text="Sube el primer contrato, factura o plano con el formulario de arriba."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {documents.map((document) => {
            const { Icon: DocIcon, className: docIconClassName } = iconForMime(document.mime_type, document.archivo_nombre);
            return (
            <Card key={document.id} className="hover-lift">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${docIconClassName}`}>
                      <DocIcon className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-2xl truncate">{document.nombre}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground truncate">{document.archivo_nombre}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Badge variant="secondary" className="shrink-0">{document.tipo}</Badge>
                    <Badge variant="outline" className="shrink-0">{formatBytes(document.tamano_bytes)}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {document.proveedor_nombre ? <Badge variant="outline" className="shrink-0">{document.proveedor_nombre}</Badge> : null}
                  {document.mime_type ? <Badge variant="outline" className="shrink-0">{document.mime_type}</Badge> : null}
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                <form action={updateDocumentAction} className="grid gap-4 lg:grid-cols-4">
                  <input name="id" type="hidden" value={document.id} />
                  <div className="grid gap-2 lg:col-span-2">
                    <Label htmlFor={`${document.id}-nombre`} required>Nombre visible</Label>
                    <Input id={`${document.id}-nombre`} name="nombre" defaultValue={document.nombre} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${document.id}-tipo`} required>Tipo</Label>
                    <Input id={`${document.id}-tipo`} name="tipo" defaultValue={document.tipo} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${document.id}-proveedor`}>Proveedor</Label>
                    <Select
                      id={`${document.id}-proveedor`}
                      name="proveedor_id"
                      defaultValue={document.proveedor_id ?? ""}
                    >
                      <option value="">Sin proveedor</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid gap-2 lg:col-span-4">
                    <Label htmlFor={`${document.id}-notas`}>Notas</Label>
                    <Textarea id={`${document.id}-notas`} name="notas" defaultValue={document.notas ?? ""} />
                  </div>
                <div className="flex flex-wrap gap-2 lg:col-span-4">
                  <SubmitButton className="flex-1 whitespace-nowrap" pendingText="Guardando…">
                    Guardar cambios
                  </SubmitButton>
                  <Button asChild variant="outline" className="flex-1 whitespace-nowrap">
                    <Link href={`/documentos/${document.id}`}>
                      <Eye className="size-4" />
                      Ver detalle
                    </Link>
                  </Button>
                  {document.download_url ? (
                    <Button asChild variant="outline" className="flex-1 whitespace-nowrap">
                      <a href={document.download_url} rel="noreferrer" target="_blank" download={document.archivo_nombre}>
                        Descargar
                      </a>
                    </Button>
                  ) : null}
                </div>
                </form>

                <form action={deleteDocumentAction} className="flex justify-end">
                  <input name="id" type="hidden" value={document.id} />
                  <ConfirmSubmit
                    confirmText={`¿Eliminar el documento «${document.nombre}»? Esta acción no se puede deshacer.`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Eliminar documento
                  </ConfirmSubmit>
                </form>
              </CardContent>
            </Card>
          );})}
        </div>
      )}
    </>
  );
}
