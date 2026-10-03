import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BriefcaseBusiness, FileText, Search, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  filterDocumentsForSearch,
  filterGuestsForSearch,
  filterSuppliersForSearch,
  normalizeSearchEntityParam,
  normalizeSearchParam
} from "@/lib/global-search";
import { estadoProveedorLabel, formatBytes, formatCurrency, formatPrecioProveedor, rsvpLabel } from "@/lib/format";
import { getDocuments, getGuests, getSuppliers } from "@/lib/data";

export const metadata = { title: "Buscar" };

type SearchEntity = "all" | "invitados" | "proveedores" | "documentos";

function SearchSection({
  title,
  icon: Icon,
  count,
  children
}: {
  title: string;
  icon: typeof Search;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-card/50">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {title}
          <Badge variant="secondary">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">{children}</CardContent>
    </Card>
  );
}

function buildSearchHref(query: string, entity: SearchEntity) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (entity !== "all") {
    params.set("entidad", entity);
  }

  const search = params.toString();
  return search ? `/busqueda?${search}` : "/busqueda";
}

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string | string[];
    entidad?: string | string[];
  }>;
}) {
  const params = (await searchParams) ?? {};
  const query = normalizeSearchParam(params.q).trim();
  const entity = normalizeSearchEntityParam(params.entidad);

  const [guests, suppliers, documents] = await Promise.all([getGuests(), getSuppliers(), getDocuments()]);
  const matchedGuests = filterGuestsForSearch(guests, query);
  const matchedSuppliers = filterSuppliersForSearch(suppliers, query);
  const matchedDocuments = filterDocumentsForSearch(documents, query);

  const sections = [
    { key: "invitados", title: "Invitados", icon: Users, count: matchedGuests.length, content: matchedGuests },
    { key: "proveedores", title: "Proveedores", icon: BriefcaseBusiness, count: matchedSuppliers.length, content: matchedSuppliers },
    { key: "documentos", title: "Documentos", icon: FileText, count: matchedDocuments.length, content: matchedDocuments }
  ] as const;

  const visibleSections = entity === "all" ? sections : sections.filter((section) => section.key === entity);
  const totalMatches =
    entity === "all"
      ? matchedGuests.length + matchedSuppliers.length + matchedDocuments.length
      : visibleSections.map((section) => section.count).reduce((total, count) => total + count, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Buscador"
        title="Búsqueda global"
        description="Busca a través de invitados, proveedores y documentos en una sola caja."
        actions={<Badge variant="secondary">{query ? `${totalMatches} resultados` : "Escribe para buscar"}</Badge>}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            Accesos rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/invitados">Invitados</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/proveedores">Proveedores</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/documentos">Documentos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mesas">Mesas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/autobuses">Autobuses</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/busqueda" method="get" className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="global-search-q">Buscar en invitados, proveedores y documentos</Label>
              <Input id="global-search-q" defaultValue={query} name="q" placeholder="Nombre, correo, proveedor, archivo, notas..." />
            </div>
            <div className="flex items-end gap-2">
              <Button className="flex-1" type="submit">
                <Search className="size-4" />
                Buscar
              </Button>
              <Button asChild className="flex-1" variant="outline">
                <Link href="/busqueda">Limpiar</Link>
              </Button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant={entity === "all" ? "default" : "outline"}>
              <Link href={buildSearchHref(query, "all")}>Todos</Link>
            </Button>
            <Button asChild size="sm" variant={entity === "invitados" ? "default" : "outline"}>
              <Link href={buildSearchHref(query, "invitados")}>Invitados</Link>
            </Button>
            <Button asChild size="sm" variant={entity === "proveedores" ? "default" : "outline"}>
              <Link href={buildSearchHref(query, "proveedores")}>Proveedores</Link>
            </Button>
            <Button asChild size="sm" variant={entity === "documentos" ? "default" : "outline"}>
              <Link href={buildSearchHref(query, "documentos")}>Documentos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!query ? (
        <EmptyState
          icon={Search}
          title="Busca cualquier cosa"
          text="Escribe un nombre, correo, proveedor o archivo para encontrar coincidencias en todo el panel."
        />
      ) : totalMatches === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          text="Prueba con otro término o busca por partes del nombre, proveedor o archivo."
        />
      ) : (
        <div className="grid gap-6">
          {visibleSections.map((section) => (
            <SearchSection key={section.key} icon={section.icon} title={section.title} count={section.count}>
              {section.content.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay {section.title.toLowerCase()} que coincidan.</p>
              ) : section.key === "invitados" ? (
                section.content.map((guest) => (
                  <div key={guest.id} className="rounded-2xl border border-border bg-background/70 p-4 hover-lift">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <Avatar name={guest.nombre} surname={guest.apellidos} size="md" />
                        <div>
                          <p className="font-semibold">{`${guest.nombre} ${guest.apellidos}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {guest.email || "Sin correo"} · {guest.grupo || "Sin grupo"} · {guest.mesa_nombre || "Sin mesa"}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Código {guest.codigo_invitacion} · RSVP {rsvpLabel(guest.confirmacion_asistencia)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/invitados/${guest.id}/qr`}>Ver QR</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/invitados">Abrir listado</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : section.key === "proveedores" ? (
                section.content.map((supplier) => (
                  <div key={supplier.id} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{supplier.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.tipo} · {estadoProveedorLabel(supplier.estado)} · {formatPrecioProveedor(supplier.precio)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {supplier.email || "Sin correo"} · {supplier.telefono || "Sin teléfono"} · {supplier.web || "Sin web"}
                        </p>
                        {supplier.notas ? <p className="mt-2 text-sm text-muted-foreground">{supplier.notas}</p> : null}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/proveedores">Abrir proveedores</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                section.content.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{document.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.tipo} · {document.proveedor_nombre || "Sin proveedor"} · {formatBytes(document.tamano_bytes)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {document.archivo_nombre} {document.mime_type ? `· ${document.mime_type}` : ""}
                        </p>
                        {document.notas ? <p className="mt-2 text-sm text-muted-foreground">{document.notas}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={document.download_url ?? "/documentos"} rel="noreferrer" target="_blank">
                            Descargar
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/documentos">Abrir documentos</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </SearchSection>
          ))}
        </div>
      )}
    </>
  );
}
