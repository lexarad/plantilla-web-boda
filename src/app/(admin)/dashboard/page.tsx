import Link from "next/link";
import { etiquetaResponsable, evento, nombresPareja, nombresParejaEnFrase } from "@/config/boda";
import {
  ArrowRight,
  BriefcaseBusiness,
  BusFront,
  CalendarClock,
  Camera,
  ChefHat,
  CheckCircle2,
  Clock3,
  Euro,
  FileText,
  Heart,
  Hourglass,
  ListChecks,
  Mail,
  MailQuestion,
  Search,
  Sparkles,
  Table2,
  UtensilsCrossed,
  Users,
  UsersRound,
  WalletCards
} from "lucide-react";
import { getDashboardData, getDashboardMetrics, getGuestsToRemind, getSuppliers } from "@/lib/data";
import { buildMenuStats } from "@/lib/catering-stats";
import { isSupplierUnavailable } from "@/lib/supplier-status";
import { formatCurrency, formatDate, formatPrecioProveedor, plural } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { getWeddingDetails } from "@/lib/wedding-details";
import { AdminCountdown } from "@/components/admin-countdown";
import { DateBlock } from "@/components/date-block";
import { ProgressRing } from "@/components/progress-ring";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inicio" };

const quickLinks = [
  { href: "/invitados", label: "Invitados", icon: Users },
  { href: "/grupos", label: "Grupos", icon: UsersRound },
  { href: "/mesas", label: "Mesas", icon: Table2 },
  { href: "/autobuses", label: "Autobuses", icon: BusFront },
  { href: "/proveedores", label: "Proveedores", icon: BriefcaseBusiness },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/cronograma", label: "Cronograma", icon: CalendarClock },
  { href: "/busqueda", label: "Búsqueda", icon: Search }
] as const;

/** Normaliza tipo/notas para comparar sin acentos ni mayúsculas. */
function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default async function DashboardPage() {
  // Los recuentos los hace la base de datos (metricas_dashboard). Aquí solo se
  // piden las dos listas que de verdad se pintan: tareas próximas y proveedores.
  const [{ upcomingTasks }, summary, suppliers, aRecordar] = await Promise.all([
    getDashboardData(),
    getDashboardMetrics(),
    getSuppliers(),
    getGuestsToRemind()
  ]);
  const details = getWeddingDetails("es");
  const menuStats = buildMenuStats(summary.menus);
  const withAllergies = summary.catering_con_alergias;
  const cateringTotal = summary.catering_total;

  const totalCapacity = summary.plazas_mesas;
  const occupiedSeats = summary.invitados_con_mesa;
  const tableOccupancyRate = totalCapacity > 0 ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  const totalBusCapacity = summary.plazas_bus;
  const busPassengers = summary.pasajeros_bus;
  const busOccupancyRate = totalBusCapacity > 0 ? Math.round((busPassengers / totalBusCapacity) * 100) : 0;

  const confirmedRate =
    summary.total_invitados > 0 ? Math.round((summary.invitados_confirmados / summary.total_invitados) * 100) : 0;
  const rejected = summary.invitados_rechazados;
  const spentRate =
    summary.presupuesto_previsto > 0 ? Math.round((summary.presupuesto_gastado / summary.presupuesto_previsto) * 100) : 0;
  const remaining = Math.max(summary.presupuesto_previsto - summary.presupuesto_gastado, 0);

  const guestsViewedRsvp = summary.invitados_vieron_rsvp;
  const guestsAnsweredRsvp = summary.invitados_respondieron_rsvp;

  // Fase actual: cotizaciones de foto y vídeo. El tipo es texto libre, así que se detecta
  // por «foto»/«vídeo» y se afina con las notas cuando el estado no basta (NO DISPONIBLE / PENDIENTE).
  const photoSuppliers = suppliers.filter((s) => /foto|video/.test(normalize(s.tipo)));
  const isPendiente = (notas: string | null) => (notas ?? "").toUpperCase().includes("PENDIENTE");
  const photoQuoted = photoSuppliers.filter((s) => s.precio > 0 && !isSupplierUnavailable(s.notas));
  const photoBestPrice = photoQuoted.reduce((best, s) => (best === 0 || s.precio < best ? s.precio : best), 0);
  const photoAwaiting = photoQuoted.filter((s) => s.estado !== "reservado" && s.estado !== "pagado").length;
  const photoNoReply = photoSuppliers.filter(
    (s) => !isSupplierUnavailable(s.notas) && s.precio === 0 && (s.estado === "contactado" || isPendiente(s.notas))
  ).length;

  // Días hasta el cierre de RSVP
  const rsvpDeadlineIso = evento.rsvpLimiteIso;
  const daysToDeadline = Math.max(
    0,
    Math.ceil((new Date(rsvpDeadlineIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Vista general"
        title="Cómo vamos"
        description="De un vistazo: qué toca ahora, confirmaciones, presupuesto, proveedores y logística."
        actions={<AdminCountdown targetIso={details.eventDateTimeIso} />}
      />

      {/* Franja de cabecera con el pulso del día */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-secondary/25 to-accent/15 p-px shadow-panel">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-card/70 px-6 py-5 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-12 top-1/2 size-44 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 size-40 rounded-full bg-secondary/30 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <DateBlock iso={details.eventDateTimeIso} locale="es" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">
                  Organización de la boda
                </p>
                <p className="font-display mt-1 text-4xl leading-none text-gradient">
                  {nombresPareja}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{details.venueLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 font-semibold text-success">
                <CheckCircle2 className="size-3.5" />
                {confirmedRate}% confirmados
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-semibold text-primary">
                <Users className="size-3.5" />
                {summary.total_invitados} invitados
              </span>
              {daysToDeadline > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 font-semibold text-warning">
                  <Clock3 className="size-3.5" />
                  {daysToDeadline} días para el cierre de RSVP
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Qué toca ahora: próximas tareas + pulso de confirmaciones, lo primero de la vista */}
      {aRecordar.length > 0 && (
        <Card className="mb-4 border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MailQuestion className="size-4 text-warning" />
              A quién conviene recordar ({aRecordar.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-sm leading-6 text-muted-foreground">
              Ordenados por quien menos ha abierto su invitación. Los de arriba ni la han visto.
            </p>
            {aRecordar.map((guest) => (
              <div
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <Link href={`/invitados/${guest.id}`} className="font-medium text-foreground hover:text-primary">
                    {guest.nombre} {guest.apellidos}
                  </Link>
                  <span className="text-muted-foreground">
                    {" · "}
                    {guest.rsvp_view_count === 0
                      ? "no ha abierto su invitación"
                      : `la abrió ${guest.rsvp_view_count} ${plural(guest.rsvp_view_count, "vez", "veces")} y no ha contestado`}
                  </span>
                </div>
                {guest.telefono ? (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={buildWhatsappUrl(
                        `¡Hola ${guest.nombre}! ¿Pudiste ver nuestra invitación? Cuando puedas, confírmanos si vendrás a la boda de ${nombresParejaEnFrase.es}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Recordar por WhatsApp
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">sin teléfono</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                Próximas tareas
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tareas">
                  Ver todas
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="grid gap-3">
                {upcomingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/tareas"
                    className="hover-lift rounded-xl border border-border bg-background/80 p-3 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-tight">{task.titulo}</p>
                      <Badge
                        variant={
                          task.prioridad === "alta"
                            ? "danger"
                            : task.prioridad === "media"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {task.prioridad}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {etiquetaResponsable(task.responsable)} · {formatDate(task.fecha_limite)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-success/40 bg-success/10 p-4 text-center">
                <CheckCircle2 className="mx-auto size-6 text-success" />
                <p className="mt-2 text-sm text-success">No hay tareas pendientes 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>

        {summary.total_invitados > 0 ? (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                Pulso RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-5">
                  <ProgressRing
                    value={guestsViewedRsvp}
                    total={summary.total_invitados}
                    tone="primary"
                    size={120}
                    thickness={10}
                    sublabel={`${guestsViewedRsvp}/${summary.total_invitados}`}
                  />
                  <span className="text-sm font-semibold">Han abierto su enlace</span>
                </div>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-5">
                  <ProgressRing
                    value={summary.invitados_confirmados}
                    total={summary.total_invitados}
                    tone="success"
                    size={120}
                    thickness={10}
                    sublabel={`${summary.invitados_confirmados}/${summary.total_invitados}`}
                  />
                  <span className="text-sm font-semibold">Han confirmado</span>
                </div>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-5">
                  <ProgressRing
                    value={summary.invitados_pendientes}
                    total={summary.total_invitados}
                    tone="warning"
                    size={120}
                    thickness={10}
                    sublabel={`${summary.invitados_pendientes}/${summary.total_invitados}`}
                  />
                  <span className="text-sm font-semibold">Sin contestar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Foto y vídeo: proveedores en cotización de la fase actual */}
      {photoSuppliers.length > 0 ? (
        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Camera className="size-4 text-primary" />
                Foto y vídeo
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  Fase actual
                </Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/proveedores">
                    Ver proveedores
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Camera} value={photoQuoted.length} label="Cotizados" note="con presupuesto" />
              <StatCard
                icon={Euro}
                value={formatPrecioProveedor(photoBestPrice)}
                label="Mejor precio"
                tone="success"
              />
              <StatCard icon={Hourglass} value={photoAwaiting} label="Esperando decisión" tone="warning" />
              <StatCard icon={MailQuestion} value={photoNoReply} label="Sin respuesta" tone="info" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* El resto: métricas globales */}
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} value={summary.total_invitados} label="Total invitados" />
        <StatCard
          icon={CheckCircle2}
          value={summary.invitados_confirmados}
          label="Confirmados"
          note={`${confirmedRate}% del total`}
          tone="success"
        />
        <StatCard icon={Clock3} value={summary.invitados_pendientes} label="Pendientes" tone="warning" />
        <StatCard icon={Euro} value={formatCurrency(summary.presupuesto_previsto)} label="Presupuesto previsto" />
        <StatCard
          icon={WalletCards}
          value={formatCurrency(summary.presupuesto_gastado)}
          label="Presupuesto gastado"
          note={`${spentRate}% usado`}
        />
        <StatCard icon={ListChecks} value={summary.tareas_pendientes} label="Tareas pendientes" tone="warning" />
        <StatCard
          icon={Table2}
          value={summary.mesas_asignadas}
          label="Mesas ocupadas"
          note={`${tableOccupancyRate}% de las plazas`}
        />
        <StatCard
          icon={BusFront}
          value={summary.autobuses_asignados}
          label="Buses con pasajeros"
          note={totalBusCapacity > 0 ? `${busOccupancyRate}% de las plazas` : undefined}
          tone="info"
        />
      </section>

      <Card className="mt-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            Progreso operativo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <ProgressBar
            label="Confirmaciones RSVP"
            value={summary.invitados_confirmados}
            total={summary.total_invitados}
            tone="success"
          />
          <ProgressBar
            label="Presupuesto usado"
            value={summary.presupuesto_gastado}
            total={summary.presupuesto_previsto}
            tone="primary"
            format="currency"
          />
          <ProgressBar label="Asientos asignados" value={occupiedSeats} total={totalCapacity} tone="info" />
          {totalBusCapacity > 0 ? (
            <ProgressBar label="Plazas de bus" value={busPassengers} total={totalBusCapacity} tone="warning" />
          ) : null}

          {/* Mini stats */}
          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs sm:grid-cols-4">
            <MiniStat label="Vistas RSVP" value={guestsViewedRsvp} />
            <MiniStat label="Han respondido" value={guestsAnsweredRsvp} />
            <MiniStat label="Rechazado" value={Math.max(rejected, 0)} />
            <MiniStat label="Disponible" value={formatCurrency(remaining)} />
          </div>
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <Card className="mt-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Accesos rápidos
            </span>
            <Badge variant="secondary" className="font-normal">
              Tu día a día
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  href={link.href}
                  key={link.href}
                  className="hover-lift group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-4 text-center transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cateringTotal > 0 && (
        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ChefHat className="size-4 text-primary" />
                Menús confirmados
              </span>
              <div className="flex items-center gap-2">
                {withAllergies > 0 && (
                  <Badge variant="warning">
                    <UtensilsCrossed className="mr-1 size-3" />
                    {withAllergies} con alergias
                  </Badge>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href="/catering">
                    Resumen completo
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {menuStats.map((stat) => (
                <div
                  key={stat.menu}
                  className="hover-lift relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-primary/3 p-4"
                >
                  <div className="absolute -right-4 -top-4 size-16 rounded-full bg-primary/5 blur-xl" />
                  <div className="relative">
                    <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="font-display text-4xl leading-none text-primary tabular-nums">{stat.count}</span>
                      <span className="mb-1 text-xs text-muted-foreground">
                        {cateringTotal > 0
                          ? `${Math.round((stat.count / cateringTotal) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

const toneStyles: Record<string, { bar: string; text: string }> = {
  success: { bar: "bg-success", text: "text-success" },
  primary: { bar: "bg-primary", text: "text-primary" },
  info: { bar: "bg-info", text: "text-info" },
  warning: { bar: "bg-warning", text: "text-warning" }
};

function ProgressBar({
  label,
  value,
  total,
  tone = "primary",
  format = "count"
}: {
  label: string;
  value: number;
  total: number;
  tone?: keyof typeof toneStyles;
  format?: "count" | "currency";
}) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(Math.round((value / safeTotal) * 100), 100);
  const t = toneStyles[tone];
  const formatted =
    format === "currency"
      ? `${formatCurrency(value)} / ${formatCurrency(total)}`
      : `${value} / ${total}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatted} · <span className={cn("font-semibold", t.text)}>{pct}%</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-700", t.bar)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-sans text-xl font-semibold leading-none text-foreground tabular-nums">{value}</p>
    </div>
  );
}
