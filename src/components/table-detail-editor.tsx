"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, ChefHat, GripVertical, Search, Users, X } from "lucide-react";
import { moveGuestToTableAction } from "@/app/(admin)/mesas/actions";
import { Avatar } from "@/components/avatar";
import { toast } from "@/components/toast-host";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { cn } from "@/lib/utils";

type Guest = {
  id: string;
  nombre: string;
  apellidos: string;
  mesa_id: string | null;
  menu_elegido: string;
  alergias_intolerancias: string | null;
  confirmacion_asistencia: string;
  grupo?: string | null;
};

type Table = {
  id: string;
  nombre: string;
  capacidad: number;
  notas: string | null;
};

type Props = {
  table: Table;
  guests: Guest[];
  otherTables: Table[];
};

const SEAT_PALETTE = [
  "bg-rose-200/80 text-rose-900",
  "bg-amber-200/80 text-amber-900",
  "bg-emerald-200/80 text-emerald-900",
  "bg-sky-200/80 text-sky-900",
  "bg-violet-200/80 text-violet-900",
  "bg-teal-200/80 text-teal-900",
  "bg-fuchsia-200/80 text-fuchsia-900",
  "bg-indigo-200/80 text-indigo-900"
];

function hashSeat(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return SEAT_PALETTE[Math.abs(h) % SEAT_PALETTE.length];
}

function initials(g: { nombre: string; apellidos: string }) {
  return `${g.nombre?.[0] ?? ""}${g.apellidos?.[0] ?? ""}`.toUpperCase();
}

function menuShort(value: string) {
  return menuChoiceOptions.find((o) => o.value === value)?.label.replace("Sin ", "").replace("Menú ", "").slice(0, 10) ?? "";
}

export function TableDetailEditor({ table, guests: initialGuests, otherTables }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [filter, setFilter] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<"this" | string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  useEffect(() => setGuests(initialGuests), [initialGuests]);

  const assigned = useMemo(() => guests.filter((g) => g.mesa_id === table.id), [guests, table.id]);
  const unassigned = useMemo(() => guests.filter((g) => !g.mesa_id), [guests]);
  const tableMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of otherTables) m.set(t.id, t.nombre);
    m.set(table.id, table.nombre);
    return m;
  }, [otherTables, table]);

  const availableToAdd = useMemo(() => {
    const pool = guests.filter((g) => g.mesa_id !== table.id);
    if (!filter) return pool.slice(0, 100);
    const q = filter.toLowerCase();
    return pool.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.apellidos.toLowerCase().includes(q) ||
        (g.grupo ?? "").toLowerCase().includes(q) ||
        (g.mesa_id ? (tableMap.get(g.mesa_id) ?? "").toLowerCase().includes(q) : "sin mesa".includes(q))
    );
  }, [guests, filter, table.id, tableMap]);

  function commitMove(guestId: string, targetTableId: string | null) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    const fromId = guest.mesa_id ?? null;
    if (fromId === targetTableId) return;

    if (targetTableId === table.id && assigned.length >= table.capacidad) {
      toast({
        type: "error",
        title: "Mesa llena",
        description: `${table.nombre} ya tiene ${table.capacidad}/${table.capacidad} asientos.`
      });
      return;
    }

    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, mesa_id: targetTableId } : g)));
    setPending((prev) => new Set(prev).add(guestId));

    const fd = new FormData();
    fd.append("guest_id", guestId);
    if (targetTableId) fd.append("mesa_id", targetTableId);

    startTransition(async () => {
      try {
        await moveGuestToTableAction(fd);
        const toName = targetTableId ? tableMap.get(targetTableId) : "Sin mesa";
        toast({
          type: "success",
          title: `${guest.nombre} ${guest.apellidos}`,
          description: targetTableId === table.id ? `Añadido a ${table.nombre}` : `Movido → ${toName ?? "Sin mesa"}`
        });
      } catch (err) {
        setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, mesa_id: fromId } : g)));
        toast({
          type: "error",
          title: "No se pudo mover",
          description: err instanceof Error ? err.message : "Inténtalo de nuevo."
        });
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(guestId);
          return next;
        });
      }
    });
  }

  function handleDragStart(e: React.DragEvent, guestId: string) {
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", guestId);
    } catch {
      /* */
    }
    setActiveDragId(guestId);
  }

  function handleDragEnd() {
    setActiveDragId(null);
    setHoverTarget(null);
  }

  function handleDragOver(e: React.DragEvent, target: "this" | string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverTarget !== target) setHoverTarget(target);
  }

  function handleDrop(e: React.DragEvent, targetTableId: string | null) {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/plain") || activeDragId;
    if (!guestId) return;
    commitMove(guestId, targetTableId);
    setActiveDragId(null);
    setHoverTarget(null);
  }

  const free = Math.max(table.capacidad - assigned.length, 0);
  const capacity = table.capacidad;
  const center = 150;
  const radius = 118;
  const seats = Array.from({ length: capacity }, (_, i) => assigned[i] ?? null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Main table canvas */}
      <div
        onDragOver={(e) => handleDragOver(e, "this")}
        onDragLeave={() => setHoverTarget(null)}
        onDrop={(e) => handleDrop(e, table.id)}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-transparent bg-gradient-to-br from-muted/70 via-secondary/40 to-muted p-6 transition-all",
          hoverTarget === "this" && free > 0 && "border-success/50 bg-success/10",
          hoverTarget === "this" && free === 0 && "border-destructive/50 bg-destructive/10"
        )}
      >
        <div className="relative size-[300px]">
          {seats.map((guest, i) => {
            const angle = (i / capacity) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle) - 22;
            const y = center + radius * Math.sin(angle) - 22;
            return (
              <div key={i} style={{ left: x, top: y }} className="absolute size-11">
                {guest ? (
                  <button
                    type="button"
                    draggable={!pending.has(guest.id)}
                    onDragStart={(e) => handleDragStart(e, guest.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => commitMove(guest.id, null)}
                    title={`${guest.nombre} ${guest.apellidos} — click para quitar de la mesa, arrastra para mover`}
                    className={cn(
                      "size-11 cursor-grab rounded-full border-2 border-card text-xs font-bold shadow-md transition-all hover:scale-110 hover:z-10 active:cursor-grabbing",
                      hashSeat(guest.id),
                      activeDragId === guest.id && "opacity-40 scale-90",
                      pending.has(guest.id) && "opacity-50"
                    )}
                  >
                    {initials(guest)}
                  </button>
                ) : (
                  <div
                    className={cn(
                      "size-11 rounded-full border-2 border-dashed border-muted-foreground/30 bg-card/40 transition-colors",
                      hoverTarget === "this" && free > 0 && "border-success bg-success/15"
                    )}
                  />
                )}
              </div>
            );
          })}

          {/* Center disc */}
          <div
            className={cn(
              "absolute inset-[22%] flex flex-col items-center justify-center rounded-full ring-4 ring-offset-2 ring-offset-background shadow-panel",
              free === 0 ? "ring-success/60 bg-success/10" : "ring-primary/30 bg-card/95"
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Mesa</span>
            <span className="font-display text-4xl leading-none">{table.nombre}</span>
            <span className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
              {assigned.length}/{capacity}
            </span>
          </div>
        </div>

        {/* Guest names list under the table */}
        {assigned.length > 0 ? (
          <div className="grid w-full max-w-md gap-1.5">
            {assigned.map((g, i) => (
              <div
                key={g.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-card/85 px-3 py-1.5 text-sm shadow-sm",
                  pending.has(g.id) && "opacity-50"
                )}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-full text-[10px] font-bold", hashSeat(g.id))}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {g.nombre} {g.apellidos}
                </span>
                <span className="text-xs text-muted-foreground">{menuShort(g.menu_elegido)}</span>
                {g.alergias_intolerancias ? <span title={g.alergias_intolerancias}>⚠</span> : null}
                <button
                  type="button"
                  onClick={() => commitMove(g.id, null)}
                  className="opacity-50 transition-opacity hover:opacity-100"
                  aria-label="Quitar de la mesa"
                  disabled={pending.has(g.id)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card/60 px-6 py-4 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 size-5 text-muted-foreground/50" />
            Arrastra invitados desde la derecha o toca uno
          </div>
        )}

        {hoverTarget === "this" && free === 0 ? (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground shadow-lg">
            Mesa llena
          </p>
        ) : null}
      </div>

      {/* Right sidebar: pool of available guests */}
      <aside className="rounded-3xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Invitados disponibles</p>
            <p className="font-display text-xl leading-tight">
              <ArrowRight className="mr-1 inline size-4 text-primary" />
              Arrastra aquí
            </p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar invitado, grupo o mesa..."
            className="w-full rounded-lg border border-border/60 bg-background/70 pl-8 pr-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Sin mesa group */}
          {unassigned.length > 0 ? (
            <>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-warning">
                Sin mesa ({unassigned.length})
              </p>
              {availableToAdd
                .filter((g) => !g.mesa_id)
                .map((g) => (
                  <SidebarGuestChip
                    key={g.id}
                    guest={g}
                    fromLabel="Sin mesa"
                    isDragging={activeDragId === g.id}
                    isPending={pending.has(g.id)}
                    onDragStart={(e) => handleDragStart(e, g.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => commitMove(g.id, table.id)}
                  />
                ))}
            </>
          ) : null}

          {/* In other tables */}
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            En otras mesas ({availableToAdd.filter((g) => g.mesa_id).length})
          </p>
          {availableToAdd
            .filter((g) => g.mesa_id)
            .map((g) => (
              <SidebarGuestChip
                key={g.id}
                guest={g}
                fromLabel={(g.mesa_id ? tableMap.get(g.mesa_id) : null) ?? ""}
                isDragging={activeDragId === g.id}
                isPending={pending.has(g.id)}
                onDragStart={(e) => handleDragStart(e, g.id)}
                onDragEnd={handleDragEnd}
                onClick={() => commitMove(g.id, table.id)}
              />
            ))}

          {availableToAdd.length === 0 ? (
            <p className="rounded-md bg-background/70 px-3 py-6 text-center text-xs text-muted-foreground">
              Sin resultados
            </p>
          ) : null}
        </div>

        <p className="mt-3 rounded-md bg-background/70 px-2 py-1.5 text-center text-[10px] text-muted-foreground">
          💡 Click para añadir · Arrastra para colocar
        </p>
      </aside>

      <div className="lg:col-span-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-border/60 bg-card/70 p-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ChefHat className="size-3" /> Menú abreviado bajo cada nombre</span>
        <span>⚠ tiene alergias</span>
        <span className="inline-flex items-center gap-1.5">
          <GripVertical className="size-3" /> Arrastra invitados a los asientos o entre listas
        </span>
      </div>
    </div>
  );
}

function SidebarGuestChip({
  guest,
  fromLabel,
  isDragging,
  isPending,
  onDragStart,
  onDragEnd,
  onClick
}: {
  guest: Guest;
  fromLabel: string;
  isDragging: boolean;
  isPending: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!isPending}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-grab items-center gap-2 rounded-lg border bg-card/90 px-2 py-1.5 text-left text-sm shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40 scale-95",
        isPending && "opacity-60"
      )}
    >
      <GripVertical className="size-3 shrink-0 text-muted-foreground/60 group-hover:text-foreground" />
      <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold leading-tight">
          {guest.nombre} {guest.apellidos}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{fromLabel}</p>
      </div>
      <ArrowRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
