import Link from "next/link";
import { mensajes } from "@/config/boda";
import { rellenarMensaje } from "@/lib/mensajes";
import { Barcode, Download, Eye, Trash2, UserPlus, Users } from "lucide-react";
import { createGuestAction, deleteGuestAction, importGuestsAction, restoreGuestAction, updateGuestAction } from "@/app/(admin)/invitados/actions";
import { getDeletedGuests, getGuests, getTables } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { formatInvitationCode } from "@/lib/invitation-code";
import { buildGuestExportSearchParams, filterGuests, normalizeSearchParam } from "@/lib/guest-filters";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { formatDateTime, plural, rsvpBadgeVariant, rsvpLabel } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { CsvImportPreview } from "@/components/csv-import-preview";
import { QuickTableSelect } from "@/components/quick-table-select";
import { SendInvitationsBatch } from "@/components/send-invitations-batch";
import { SubmitButton } from "@/components/submit-button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildRsvpUrl } from "@/lib/rsvp-link";

export const metadata = { title: "Invitados" };

const rsvpOptions = [
  ["pendiente", "Pendiente"],
  ["confirmado", "Confirmado"],
  ["rechazado", "No asiste"]
];

export default async function GuestsPage({
  searchParams
}: {
  searchParams?: Promise<{
    q?: string | string[];
    estado?: string | string[];
    mesa?: string | string[];
    pagina?: string | string[];
  }>;
}) {
  const [guests, tables, deletedGuests] = await Promise.all([getGuests(), getTables(), getDeletedGuests()]);
  const params = (await searchParams) ?? {};
  const filteredGuests = filterGuests(guests, params);

  const guestsCountByTable: Record<string, number> = {};
  for (const g of guests) {
    if (g.mesa_id) {
      guestsCountByTable[g.mesa_id] = (guestsCountByTable[g.mesa_id] ?? 0) + 1;
    }
  }
  // Paginación: con 30 invitados da igual, pero los días previos a la boda la
  // lista se consulta desde el móvil y pintar 150 fichas de golpe la atasca.
  const POR_PAGINA = 40;
  const paginaParam = Array.isArray(params.pagina) ? params.pagina[0] : params.pagina;
  const totalPaginas = Math.max(1, Math.ceil(filteredGuests.length / POR_PAGINA));
  const pagina = Math.min(Math.max(Number.parseInt(paginaParam ?? "1", 10) || 1, 1), totalPaginas);
  const guestsPagina = filteredGuests.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /** Conserva los filtros al cambiar de página. */
  function hrefPagina(destino: number) {
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (clave === "pagina" || valor === undefined) continue;
      for (const item of Array.isArray(valor) ? valor : [valor]) query.append(clave, item);
    }
    if (destino > 1) query.set("pagina", String(destino));
    const cadena = query.toString();
    return cadena ? `/invitados?${cadena}` : "/invitados";
  }

  const exportSearchParams = buildGuestExportSearchParams(params);
  const exportHref = exportSearchParams.toString() ? `/invitados/export?${exportSearchParams.toString()}` : "/invitados/export";

  const siteUrl = await getSiteUrl();

  return (
    <>
      <AdminPageHeader
        eyebrow="Lista de invitados"
        title="Invitados"
        description="Crea, edita y filtra invitados. Cada uno tiene un código único y un enlace personal de RSVP."
        actions={
          <>
            <Badge variant="secondary">{filteredGuests.length} {plural(filteredGuests.length, "visible")}</Badge>
            <Badge variant="outline">{guests.length} {plural(guests.length, "total", "totales")}</Badge>
            <Button asChild variant="outline">
              <Link href={exportHref}>
                <Download className="size-4" />
                Exportar CSV
              </Link>
            </Button>
          </>
        }
      />

      {guests.length > 0 ? (
        <div className="mb-6">
          <SendInvitationsBatch guests={guests} siteUrl={siteUrl} />
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Nuevo invitado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGuestAction} className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="guest-new-nombre" required>Nombre</Label>
              <Input id="guest-new-nombre" name="nombre" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-apellidos" required>Apellidos</Label>
              <Input id="guest-new-apellidos" name="apellidos" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-email">Correo</Label>
              <Input id="guest-new-email" name="email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-telefono">Teléfono</Label>
              <Input id="guest-new-telefono" name="telefono" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-grupo">Grupo/familia</Label>
              <Input id="guest-new-grupo" name="grupo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-confirmacion">Confirmación</Label>
              <Select id="guest-new-confirmacion" name="confirmacion_asistencia" defaultValue="pendiente">
                {rsvpOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-menu">Menú</Label>
              <Select id="guest-new-menu" name="menu_elegido" defaultValue="pendiente">
                {menuChoiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-mesa">Mesa</Label>
              <Select id="guest-new-mesa" name="mesa_id" defaultValue="">
                <option value="">Sin mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="guest-new-alergias">Alergias/intolerancias</Label>
              <Textarea id="guest-new-alergias" name="alergias_intolerancias" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-new-hotel">Hotel/alojamiento</Label>
              <Input id="guest-new-hotel" name="hotel_alojamiento" />
            </div>
            <CheckboxField
              className="self-end rounded-md border border-border bg-background px-3"
              name="necesita_autobus"
            >
              Necesita autobús
            </CheckboxField>
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="guest-new-notas">Notas internas</Label>
              <Textarea id="guest-new-notas" name="notas_internas" />
            </div>
            <SubmitButton className="lg:col-span-4" pendingText="Creando…">
              Crear invitado
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="mb-6">
        <CsvImportPreview action={importGuestsAction} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Buscar y filtrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/invitados" method="get" className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr_0.9fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="guest-search-q">Buscar</Label>
              <Input
                id="guest-search-q"
                defaultValue={normalizeSearchParam(params.q)}
                name="q"
                placeholder="Nombre, correo, grupo, mesa o código"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-search-estado">Estado RSVP</Label>
              <Select id="guest-search-estado" defaultValue={normalizeSearchParam(params.estado) || "todos"} name="estado">
                <option value="todos">Todos</option>
                {rsvpOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest-search-mesa">Mesa</Label>
              <Select id="guest-search-mesa" defaultValue={normalizeSearchParam(params.mesa) || "todos"} name="mesa">
                <option value="todos">Todas</option>
                <option value="sin_mesa">Sin mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                Aplicar
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/invitados">Limpiar</Link>
              </Button>
            </div>
          </form>

          {/* Quick filter chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Filtros rápidos</span>
            {[
              { value: "todos", label: "Todos", icon: "•" },
              { value: "confirmado", label: "Confirmados", icon: "✓" },
              { value: "pendiente", label: "Pendientes", icon: "·" },
              { value: "rechazado", label: "No asisten", icon: "✗" }
            ].map((f) => {
              const current = normalizeSearchParam(params.estado) || "todos";
              const active = current === f.value;
              const href = f.value === "todos" ? "/invitados" : `/invitados?estado=${f.value}`;
              return (
                <Link
                  key={f.value}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5")
                  }
                >
                  <span className="opacity-70">{f.icon}</span>
                  {f.label}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {guests.length === 0 ? (
        <EmptyState icon={Users} title="Sin invitados todavía" text="Añade el primer invitado con el formulario de arriba para empezar a generar enlaces RSVP." />
      ) : filteredGuests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          text="No hay invitados que coincidan con la búsqueda o los filtros actuales."
        />
      ) : (
        <div className="grid gap-4">
          {guestsPagina.map((guest) => {
            const invitationCode = formatInvitationCode(guest.codigo_invitacion);
            const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);
            const whatsappUrl = buildWhatsappUrl(rellenarMensaje(mensajes.whatsappInvitacion, { nombre: guest.nombre, enlace: rsvpUrl }));
            const lastView = formatDateTime(guest.rsvp_last_view_at);
            const lastSubmit = formatDateTime(guest.rsvp_last_submitted_at);

            return (
              <Card key={guest.id} className="hover-lift">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={guest.nombre} surname={guest.apellidos} size="lg" />
                    <div className="min-w-0">
                      <CardTitle>{`${guest.nombre} ${guest.apellidos}`}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{guest.grupo || "Sin grupo"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <QuickTableSelect
                          guestId={guest.id}
                          guestName={`${guest.nombre} ${guest.apellidos}`}
                          currentMesaId={guest.mesa_id}
                          currentMesaName={guest.mesa_nombre ?? null}
                          tables={tables}
                          guestsCountByTable={guestsCountByTable}
                        />
                        <Badge variant="outline">{guest.rsvp_view_count} vistas</Badge>
                        <Badge variant="outline">{guest.rsvp_submit_count} respuestas</Badge>
                        <Badge variant="secondary">Código {invitationCode}</Badge>
                        {lastView ? <Badge variant="secondary">Último acceso {lastView}</Badge> : null}
                        {lastSubmit ? <Badge variant="secondary">Última respuesta {lastSubmit}</Badge> : null}
                      </div>
                    </div>
                  </div>
                  <Badge variant={rsvpBadgeVariant(guest.confirmacion_asistencia)}>
                    {rsvpLabel(guest.confirmacion_asistencia)}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <form action={updateGuestAction} className="grid gap-4 lg:grid-cols-4">
                    <input name="id" type="hidden" value={guest.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-nombre`} required>Nombre</Label>
                      <Input id={`guest-${guest.id}-nombre`} name="nombre" defaultValue={guest.nombre} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-apellidos`} required>Apellidos</Label>
                      <Input id={`guest-${guest.id}-apellidos`} name="apellidos" defaultValue={guest.apellidos} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-email`}>Correo</Label>
                      <Input id={`guest-${guest.id}-email`} name="email" type="email" defaultValue={guest.email ?? ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-telefono`}>Teléfono</Label>
                      <Input id={`guest-${guest.id}-telefono`} name="telefono" defaultValue={guest.telefono ?? ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-grupo`}>Grupo/familia</Label>
                      <Input id={`guest-${guest.id}-grupo`} name="grupo" defaultValue={guest.grupo ?? ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-confirmacion`}>Confirmación</Label>
                      <Select id={`guest-${guest.id}-confirmacion`} name="confirmacion_asistencia" defaultValue={guest.confirmacion_asistencia}>
                        {rsvpOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-menu`}>Menú</Label>
                      <Select id={`guest-${guest.id}-menu`} name="menu_elegido" defaultValue={guest.menu_elegido}>
                        {menuChoiceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-mesa`}>Mesa</Label>
                      <Select id={`guest-${guest.id}-mesa`} name="mesa_id" defaultValue={guest.mesa_id ?? ""}>
                        <option value="">Sin mesa</option>
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.nombre}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2 lg:col-span-2">
                      <Label htmlFor={`guest-${guest.id}-alergias`}>Alergias/intolerancias</Label>
                      <Textarea id={`guest-${guest.id}-alergias`} name="alergias_intolerancias" defaultValue={guest.alergias_intolerancias ?? ""} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`guest-${guest.id}-hotel`}>Hotel/alojamiento</Label>
                      <Input id={`guest-${guest.id}-hotel`} name="hotel_alojamiento" defaultValue={guest.hotel_alojamiento ?? ""} />
                    </div>
                    <CheckboxField
                      className="self-end rounded-md border border-border bg-background px-3"
                      defaultChecked={guest.necesita_autobus}
                      name="necesita_autobus"
                    >
                      Necesita autobús
                    </CheckboxField>
                    <div className="grid gap-2 lg:col-span-4">
                      <Label htmlFor={`guest-${guest.id}-notas`}>Notas internas</Label>
                      <Textarea id={`guest-${guest.id}-notas`} name="notas_internas" defaultValue={guest.notas_internas ?? ""} />
                    </div>
                    <div className="grid gap-2 lg:col-span-4">
                      <Label htmlFor={`guest-${guest.id}-codigo`}>Código de invitación</Label>
                      <Input id={`guest-${guest.id}-codigo`} readOnly value={invitationCode} />
                    </div>
                    <div className="grid gap-2 lg:col-span-4">
                      <Label htmlFor={`guest-${guest.id}-rsvp-url`}>Enlace RSVP</Label>
                      <Input id={`guest-${guest.id}-rsvp-url`} readOnly value={rsvpUrl} />
                    </div>
                    <div className="flex flex-col gap-3 lg:col-span-4 lg:flex-row">
                      <SubmitButton className="flex-1" pendingText="Guardando…">
                        Guardar cambios
                      </SubmitButton>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/invitados/${guest.id}`}>
                          <Eye className="size-4" />
                          Ver ficha
                        </Link>
                      </Button>
                      <WhatsAppButton className="flex-1" href={whatsappUrl} />
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/invitados/${guest.id}/qr`}>
                          <Barcode className="size-4" />
                          Ver QR
                        </Link>
                      </Button>
                    </div>
                  </form>
                  <form action={deleteGuestAction} className="flex justify-end">
                    <input name="id" type="hidden" value={guest.id} />
                    <ConfirmSubmit confirmText={`¿Mover a ${guest.nombre} ${guest.apellidos} a la papelera? Podrás recuperarlo desde el final de esta página.`}>
                      <Trash2 className="size-4" />
                      Mover a la papelera
                    </ConfirmSubmit>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Paginación de invitados">
          <Button asChild variant="outline" size="sm" disabled={pagina === 1}>
            <Link href={hrefPagina(pagina - 1)} aria-disabled={pagina === 1}>
              Anteriores
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagina} de {totalPaginas} · {filteredGuests.length} {plural(filteredGuests.length, "invitado", "invitados")}
          </span>
          <Button asChild variant="outline" size="sm" disabled={pagina === totalPaginas}>
            <Link href={hrefPagina(pagina + 1)} aria-disabled={pagina === totalPaginas}>
              Siguientes
            </Link>
          </Button>
        </nav>
      )}

      {deletedGuests.length > 0 && (
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="size-4 text-muted-foreground" />
              Papelera · {plural(deletedGuests.length, "invitado", "invitados")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-sm leading-6 text-muted-foreground">
              Aquí quedan los invitados eliminados. Puedes devolverlos a la lista con todos sus datos.
            </p>
            {deletedGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {guest.nombre} {guest.apellidos}
                  </span>
                  {guest.grupo ? <span className="text-muted-foreground"> · {guest.grupo}</span> : null}
                  <span className="text-muted-foreground"> · eliminado el {formatDateTime(guest.eliminado_en)}</span>
                </div>
                <form action={restoreGuestAction}>
                  <input name="id" type="hidden" value={guest.id} />
                  <SubmitButton size="sm" pendingText="Recuperando…">
                    Recuperar
                  </SubmitButton>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
