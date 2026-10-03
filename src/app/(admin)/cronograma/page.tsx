import Link from "next/link";
import { CalendarClock, ExternalLink, MapPin, Plus, Trash2 } from "lucide-react";
import {
  createTimelineEventAction,
  deleteTimelineEventAction,
  updateTimelineEventAction
} from "@/app/(admin)/cronograma/actions";
import { getTimelineEvents } from "@/lib/data";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getWeddingDetails } from "@/lib/wedding-details";
import { programa } from "@/config/boda";

export const metadata = { title: "Cronograma" };

// Momentos fijos: salen del programa de src/config/boda.ts.
const FIXED_EVENTS = programa.es.map((momento) => ({
  hora: momento.hora,
  titulo: momento.titulo,
  descripcion: momento.texto || null
}));

function timeToMinutes(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export default async function CronogramaPage() {
  const [customEvents, details] = await Promise.all([
    getTimelineEvents(),
    Promise.resolve(getWeddingDetails("es"))
  ]);

  const allEvents = [
    ...FIXED_EVENTS.map((e) => ({
      ...e,
      id: `fixed-${e.hora}`,
      titulo_ca: null,
      descripcion_ca: null,
      fijo: true,
      created_at: ""
    })),
    ...customEvents
  ].sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

  return (
    <>
      <AdminPageHeader
        eyebrow="Planificación"
        title="Cronograma del día"
        description="Programa real del día con eventos fijos y los que añadáis vosotros. La vista pública está en /programa."
        actions={
          <>
            <Badge variant="secondary">{details.dateLabel}</Badge>
            <Badge variant="outline">{details.venueName}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/programa" target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Vista pública
              </Link>
            </Button>
            <PrintButton label="Imprimir" />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <div>
          <div className="relative grid gap-0">
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border print:bg-muted-foreground/40" />

            {allEvents.map((event, index) => (
              <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="w-20 shrink-0 pt-0.5 text-right">
                  <span className="text-sm font-bold tabular-nums text-primary">{event.hora}</span>
                </div>
                <div className="relative z-10 mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <div className="size-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-snug">{event.titulo}</p>
                      {event.descripcion && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{event.descripcion}</p>
                      )}
                      {event.fijo && (
                        <Badge variant="secondary" className="mt-1.5 text-[10px]">
                          Evento fijo
                        </Badge>
                      )}
                    </div>
                    {!event.fijo && (
                      <div className="flex shrink-0 gap-1 print:hidden">
                        <form action={deleteTimelineEventAction}>
                          <input name="id" type="hidden" value={event.id} />
                          <ConfirmSubmit
                            size="icon"
                            confirmText={`¿Eliminar «${event.titulo}» del cronograma? Esta acción no se puede deshacer.`}
                            pendingText=""
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            <span className="sr-only">Eliminar evento</span>
                          </ConfirmSubmit>
                        </form>
                      </div>
                    )}
                  </div>
                  {!event.fijo && (
                    <form action={updateTimelineEventAction} className="mt-3 grid gap-2 print:hidden">
                      <input name="id" type="hidden" value={event.id} />
                      <div className="flex gap-2">
                        <Input aria-label="Hora" name="hora" defaultValue={event.hora} placeholder="HH:MM" className="w-24 text-sm" />
                        <Input aria-label="Título" name="titulo" defaultValue={event.titulo} className="flex-1 text-sm" required />
                        <SubmitButton size="sm" className="shrink-0" pendingText="Guardando…">
                          Guardar cambios
                        </SubmitButton>
                      </div>
                      <Textarea name="descripcion" defaultValue={event.descripcion ?? ""} className="text-sm" placeholder="Descripción opcional…" />
                      <Input name="titulo_ca" defaultValue={event.titulo_ca ?? ""} className="text-sm" placeholder="Título en catalán (opcional)" />
                      <Textarea name="descripcion_ca" defaultValue={event.descripcion_ca ?? ""} className="text-sm" placeholder="Descripció en català (opcional)…" />
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allEvents.length === 0 && (
            <EmptyState icon={CalendarClock} title="Sin eventos" text="Añade eventos personalizados al cronograma." />
          )}

          <Card className="mt-6 print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Lugar y transporte
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-md border border-border bg-background/70 p-3">
                <p className="font-semibold">{details.venueName}</p>
                <p className="mt-0.5 text-muted-foreground">{details.venueLocation}</p>
                <p className="mt-2 text-muted-foreground leading-relaxed">{details.venueCopy}</p>
              </div>
              <div className="rounded-md border border-border bg-background/70 p-3">
                <p className="font-semibold">{details.transportLabel}</p>
                <p className="mt-0.5 text-muted-foreground">{details.transportCopy}</p>
              </div>
              <div className="rounded-md border border-border bg-background/70 p-3">
                <p className="font-semibold">Dress code</p>
                <p className="mt-0.5 text-muted-foreground">{details.dressCode}</p>
              </div>
              <div className="rounded-md border border-border bg-background/70 p-3">
                <p className="font-semibold">Confirmación antes del</p>
                <p className="mt-0.5 text-muted-foreground">{details.rsvpDeadline}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 self-start print:hidden xl:sticky xl:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Añadir evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTimelineEventAction} className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="event-new-hora" required>Hora (HH:MM)</Label>
                  <Input id="event-new-hora" name="hora" placeholder="15:30" pattern="\d{2}:\d{2}" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-new-titulo" required>Título</Label>
                  <Input id="event-new-titulo" name="titulo" placeholder="Vals nupcial" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-new-descripcion">Descripción</Label>
                  <Textarea id="event-new-descripcion" name="descripcion" placeholder="Detalles opcionales…" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-new-titulo-ca">Título en catalán (opcional)</Label>
                  <Input id="event-new-titulo-ca" name="titulo_ca" placeholder="Vals nupcial" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-new-descripcion-ca">Descripció en català (opcional)</Label>
                  <Textarea id="event-new-descripcion-ca" name="descripcion_ca" placeholder="Detalls opcionals…" />
                </div>
                <SubmitButton className="w-full" pendingText="Añadiendo…">
                  Añadir al cronograma
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
