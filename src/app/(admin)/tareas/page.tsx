import { CheckCircle2, ClipboardList, Clock3, Loader2, Trash2 } from "lucide-react";
import { RESPONSABLES, etiquetaResponsable } from "@/config/boda";
import { createTaskAction, deleteTaskAction, updateTaskAction } from "@/app/(admin)/tareas/actions";
import { getTasks } from "@/lib/data";
import { formatDate, plural } from "@/lib/format";
import { CountUp } from "@/components/count-up";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { PlannerTask } from "@/lib/types";

export const metadata = { title: "Tareas" };

const statusOptions: [PlannerTask["estado"], string][] = [
  ["pendiente", "Pendiente"],
  ["en_progreso", "En progreso"],
  ["hecha", "Hecha"]
];
const priorityOptions: [PlannerTask["prioridad"], string][] = [
  ["baja", "Baja"],
  ["media", "Media"],
  ["alta", "Alta"]
];

const columns: {
  estado: PlannerTask["estado"];
  label: string;
  accent: string;
  icon: LucideIcon;
}[] = [
  {
    estado: "pendiente",
    label: "Pendiente",
    accent: "border-warning/30 bg-warning/5",
    icon: Clock3
  },
  {
    estado: "en_progreso",
    label: "En progreso",
    accent: "border-info/30 bg-info/5",
    icon: Loader2
  },
  {
    estado: "hecha",
    label: "Hecha",
    accent: "border-success/30 bg-success/5",
    icon: CheckCircle2
  }
];

function priorityStripe(p: PlannerTask["prioridad"]) {
  if (p === "alta") return "before:bg-destructive";
  if (p === "media") return "before:bg-warning";
  return "before:bg-success";
}

function TaskCard({ task }: { task: PlannerTask }) {
  const overdue =
    task.fecha_limite && task.estado !== "hecha" && new Date(task.fecha_limite) < new Date();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-background/95 p-4 shadow-sm transition-shadow hover:shadow-md",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        priorityStripe(task.prioridad)
      )}
    >
      <div className="flex items-start justify-between gap-2 pl-2">
        <p className="font-semibold leading-snug">{task.titulo}</p>
        <Badge
          variant={task.prioridad === "alta" ? "danger" : task.prioridad === "media" ? "warning" : "success"}
          className="shrink-0"
        >
          {task.prioridad}
        </Badge>
      </div>
      <p className="mt-1 pl-2 text-xs text-muted-foreground">
        {etiquetaResponsable(task.responsable)} · {formatDate(task.fecha_limite)}
        {overdue ? <span className="ml-2 font-semibold text-destructive">· vencida</span> : null}
      </p>
      {task.descripcion && (
        <p className="mt-2 pl-2 text-sm text-muted-foreground line-clamp-3">{task.descripcion}</p>
      )}

      <form action={updateTaskAction} className="mt-4 grid gap-3 pl-2">
        <input name="id" type="hidden" value={task.id} />
        <input name="titulo" type="hidden" value={task.titulo} />
        <input name="descripcion" type="hidden" value={task.descripcion ?? ""} />
        <input name="responsable" type="hidden" value={task.responsable} />
        <input name="fecha_limite" type="hidden" value={task.fecha_limite ?? ""} />
        <input name="prioridad" type="hidden" value={task.prioridad} />
        <div className="flex items-center gap-2">
          <Select aria-label="Estado de la tarea" name="estado" defaultValue={task.estado} className="flex-1 text-xs">
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <SubmitButton size="sm" pendingText="Moviendo…">
            Mover
          </SubmitButton>
        </div>
      </form>

      <form action={deleteTaskAction} className="mt-2 flex justify-end pl-2">
        <input name="id" type="hidden" value={task.id} />
        <ConfirmSubmit
          size="icon"
          confirmText={`¿Eliminar la tarea «${task.titulo}»? Esta acción no se puede deshacer.`}
          pendingText=""
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Eliminar tarea</span>
        </ConfirmSubmit>
      </form>
    </div>
  );
}

export default async function TasksPage() {
  const tasks = await getTasks();
  const total = tasks.length;
  const done = tasks.filter((task) => task.estado === "hecha").length;
  const inProgress = tasks.filter((task) => task.estado === "en_progreso").length;
  const pending = tasks.filter((task) => task.estado === "pendiente").length;
  const progressRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const highOpen = tasks.filter(
    (task) => task.prioridad === "alta" && task.estado !== "hecha"
  ).length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Planificación"
        title="Tareas"
        description="Pendientes, en progreso y hechas. Cada tarea tiene responsable, fecha límite y prioridad."
        actions={
          <>
            <Badge variant="secondary">{total} {plural(total, "tarea")}</Badge>
            <Badge variant="success">{done} {plural(done, "hecha")}</Badge>
            {highOpen > 0 ? <Badge variant="danger">{highOpen} {plural(highOpen, "alta pendiente", "altas pendientes")}</Badge> : null}
          </>
        }
      />

      {total > 0 ? (
        <Card className="mb-6 border-border/60">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold">Progreso global</span>
              <span className="text-muted-foreground">
                {done} / {total} · <span className="font-semibold text-success">{progressRate}%</span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all duration-700"
                style={{ width: `${progressRate}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warning">Pendiente</p>
                <p className="mt-1 font-sans font-semibold text-xl leading-none tabular-nums">
                  <CountUp to={pending} />
                </p>
              </div>
              <div className="rounded-lg border border-info/30 bg-info/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-info">En progreso</p>
                <p className="mt-1 font-sans font-semibold text-xl leading-none tabular-nums">
                  <CountUp to={inProgress} />
                </p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-success">Hechas</p>
                <p className="mt-1 font-sans font-semibold text-xl leading-none tabular-nums">
                  <CountUp to={done} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            Nueva tarea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTaskAction} className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="task-new-titulo" required>Título</Label>
              <Input id="task-new-titulo" name="titulo" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-new-responsable">Responsable</Label>
              <Select id="task-new-responsable" name="responsable" defaultValue="ambos">
                {RESPONSABLES.map((owner) => (
                  <option key={owner} value={owner}>
                    {etiquetaResponsable(owner)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-new-fecha">Fecha límite</Label>
              <Input id="task-new-fecha" name="fecha_limite" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-new-estado">Estado</Label>
              <Select id="task-new-estado" name="estado" defaultValue="pendiente">
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-new-prioridad">Prioridad</Label>
              <Select id="task-new-prioridad" name="prioridad" defaultValue="media">
                {priorityOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="task-new-descripcion">Descripción</Label>
              <Textarea id="task-new-descripcion" name="descripcion" />
            </div>
            <SubmitButton className="lg:col-span-4" pendingText="Creando…">
              Crear tarea
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin tareas"
          text="Crea la primera tarea con el formulario de arriba: título, responsable y fecha límite."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {columns.map(({ estado, label, accent, icon: Icon }) => {
            const col = tasks.filter((task) => task.estado === estado);
            return (
              <div key={estado} className={cn("rounded-2xl border-2 p-4", accent)}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                    <Icon className="size-4" />
                    {label}
                  </h2>
                  <Badge variant="secondary">{col.length}</Badge>
                </div>
                {col.length === 0 ? (
                  <p className="text-center text-sm italic text-muted-foreground py-6">Sin tareas</p>
                ) : (
                  <div className="grid gap-3">
                    {col.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
