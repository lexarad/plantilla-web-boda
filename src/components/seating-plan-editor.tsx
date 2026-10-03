"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChefHat, GripVertical, MousePointerClick, Search, UserPlus, Users, X } from "lucide-react";
import { moveGuestToTableAction } from "@/app/(admin)/mesas/actions";
import { Avatar } from "@/components/avatar";
import { toast } from "@/components/toast-host";
import { cn } from "@/lib/utils";
import { menuChoiceOptions } from "@/lib/rsvp-options";

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
  guests: Guest[];
  tables: Table[];
};

type ActiveDrag = {
  guestId: string;
  fromTableId: string | null;
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

function rsvpDot(status: string) {
  if (status === "confirmado") return "bg-success";
  if (status === "rechazado") return "bg-destructive";
  return "bg-warning";
}

function menuShort(value: string) {
  const opt = menuChoiceOptions.find((o) => o.value === value);
  if (!opt) return "";
  return opt.label.replace("Menú ", "").replace("Sense ", "").replace("Sin ", "").slice(0, 12);
}

export function SeatingPlanEditor({ guests: initialGuests, tables }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [pickedGuestId, setPickedGuestId] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | "unassigned" | null>(null);
  const [filter, setFilter] = useState("");
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Sync if server data changes
  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  // ESC cancels selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPickedGuestId(null);
        setActiveDrag(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const guestsByTable = useMemo(() => {
    const map = new Map<string | "unassigned", Guest[]>();
    map.set("unassigned", []);
    for (const t of tables) map.set(t.id, []);
    for (const g of guests) {
      const key = g.mesa_id ?? "unassigned";
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    return map;
  }, [guests, tables]);

  const unassigned = guestsByTable.get("unassigned") ?? [];
  const filteredUnassigned = unassigned.filter((g) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      g.nombre.toLowerCase().includes(q) ||
      g.apellidos.toLowerCase().includes(q) ||
      (g.grupo ?? "").toLowerCase().includes(q)
    );
  });

  function commitMove(guestId: string, targetTableId: string | null) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    const fromTableId = guest.mesa_id ?? null;
    if (fromTableId === targetTableId) return;

    // Capacity check
    if (targetTableId) {
      const target = tables.find((t) => t.id === targetTableId);
      if (!target) return;
      const occupied = (guestsByTable.get(targetTableId) ?? []).length;
      if (occupied >= target.capacidad) {
        toast({
          type: "error",
          title: "Mesa llena",
          description: `${target.nombre} ya tiene ${target.capacidad}/${target.capacidad} asientos.`
        });
        return;
      }
    }

    // Optimistic update
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, mesa_id: targetTableId } : g)));
    setPending((prev) => new Set(prev).add(guestId));

    const fd = new FormData();
    fd.append("guest_id", guestId);
    if (targetTableId) fd.append("mesa_id", targetTableId);

    startTransition(async () => {
      try {
        await moveGuestToTableAction(fd);
        const targetName = targetTableId ? tables.find((t) => t.id === targetTableId)?.nombre : "Sin mesa";
        toast({
          type: "success",
          title: "Invitado movido",
          description: `${guest.nombre} ${guest.apellidos} → ${targetName ?? "Sin mesa"}`
        });
      } catch (err) {
        // Rollback
        setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, mesa_id: fromTableId } : g)));
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

  function handleDragStart(e: React.DragEvent, guestId: string, fromTableId: string | null) {
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", guestId);
    } catch {
      /* old browsers */
    }
    setActiveDrag({ guestId, fromTableId });
  }

  function handleDragEnd() {
    setActiveDrag(null);
    setHoveredTable(null);
  }

  function handleDragOver(e: React.DragEvent, targetId: string | "unassigned") {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoveredTable !== targetId) setHoveredTable(targetId);
  }

  function handleDrop(e: React.DragEvent, targetId: string | "unassigned") {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/plain") || activeDrag?.guestId;
    if (!guestId) return;
    commitMove(guestId, targetId === "unassigned" ? null : targetId);
    setActiveDrag(null);
    setHoveredTable(null);
  }

  // Click-to-pick fallback (touch + a11y)
  function handlePickGuest(guestId: string) {
    setPickedGuestId((prev) => (prev === guestId ? null : guestId));
  }

  function handleClickTarget(targetId: string | null) {
    if (!pickedGuestId) return;
    commitMove(pickedGuestId, targetId);
    setPickedGuestId(null);
  }

  const totalAssigned = guests.filter((g) => g.mesa_id).length;
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacidad, 0);

  return (
    <div className="grid gap-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/85 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <Users className="size-3.5" /> {totalAssigned}/{totalCapacity} asignados
          </span>
          {unassigned.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
              <UserPlus className="size-3.5" /> {unassigned.length} sin mesa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              ✓ Todos asignados
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MousePointerClick className="size-3.5" />
          <span>Toca un invitado y luego toca su mesa de destino · También puedes arrastrarlos entre mesas</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Sidebar: unassigned pool */}
        <aside
          className={cn(
            "rounded-2xl border-2 border-dashed border-warning/40 bg-warning/5 p-4 transition-all",
            hoveredTable === "unassigned" && "border-warning bg-warning/15 ring-4 ring-warning/25"
          )}
          onDragOver={(e) => handleDragOver(e, "unassigned")}
          onDragLeave={() => setHoveredTable(null)}
          onDrop={(e) => handleDrop(e, "unassigned")}
          onClick={() => pickedGuestId && handleClickTarget(null)}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-warning">Sin mesa</p>
              <p className="font-display text-2xl leading-tight">{unassigned.length} invitados</p>
            </div>
            <Users className="size-5 text-warning" />
          </div>

          {unassigned.length > 0 ? (
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-warning/30 bg-card/80 pl-8 pr-2 py-1.5 text-xs focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/20"
              />
            </div>
          ) : null}

          <div className="grid gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredUnassigned.length === 0 ? (
              <p className="rounded-lg bg-card/50 px-3 py-6 text-center text-xs text-muted-foreground">
                {unassigned.length === 0
                  ? "✓ Todos los invitados tienen mesa asignada"
                  : "Sin resultados para tu búsqueda"}
              </p>
            ) : (
              filteredUnassigned.map((g) => (
                <GuestChip
                  key={g.id}
                  guest={g}
                  isDragging={activeDrag?.guestId === g.id}
                  isPicked={pickedGuestId === g.id}
                  isPending={pending.has(g.id)}
                  onDragStart={(e) => handleDragStart(e, g.id, null)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePickGuest(g.id);
                  }}
                />
              ))
            )}
          </div>
        </aside>

        {/* Tables canvas */}
        <main className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/70 via-secondary/40 to-muted p-4 sm:p-6">
          {tables.length === 0 ? (
            <div className="rounded-xl bg-card/60 p-12 text-center text-sm text-muted-foreground">
              No hay mesas creadas todavía. Vuelve a <span className="font-semibold">/mesas</span> para crearlas.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {tables.map((table, idx) => {
                const assigned = guestsByTable.get(table.id) ?? [];
                const isHovered = hoveredTable === table.id;
                const isFull = assigned.length >= table.capacidad;
                const free = Math.max(table.capacidad - assigned.length, 0);
                return (
                  <VisualTableSlot
                    key={table.id}
                    table={table}
                    number={idx + 1}
                    guests={assigned}
                    isHovered={isHovered}
                    isFull={isFull}
                    free={free}
                    pickedGuestId={pickedGuestId}
                    pending={pending}
                    activeDrag={activeDrag}
                    onDragOver={(e) => handleDragOver(e, table.id)}
                    onDragLeave={() => setHoveredTable(null)}
                    onDrop={(e) => handleDrop(e, table.id)}
                    onClickTable={() => pickedGuestId && handleClickTarget(table.id)}
                    onDragStartGuest={(e, g) => handleDragStart(e, g.id, table.id)}
                    onDragEndGuest={handleDragEnd}
                    onPickGuest={(g) => handlePickGuest(g.id)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {pickedGuestId ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-full border border-primary/30 bg-card/95 px-4 py-2 text-sm shadow-panel backdrop-blur-xl">
          <span className="font-semibold">Selecciona destino</span>{" "}
          <span className="text-muted-foreground">o pulsa</span>{" "}
          <kbd className="rounded border border-border bg-background px-1.5 font-mono text-xs">ESC</kbd>{" "}
          <button
            type="button"
            onClick={() => setPickedGuestId(null)}
            className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-foreground hover:text-background"
            aria-label="Cancelar"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GuestChip({
  guest,
  isDragging,
  isPicked,
  isPending,
  onDragStart,
  onDragEnd,
  onClick
}: {
  guest: Guest;
  isDragging: boolean;
  isPicked: boolean;
  isPending: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      draggable={!isPending}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-grab items-center gap-2 rounded-lg border bg-card/85 px-2 py-1.5 text-left text-sm shadow-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40 scale-95",
        isPicked && "ring-2 ring-primary border-primary bg-primary/5 animate-pulse",
        isPending && "opacity-60"
      )}
      aria-label={`${guest.nombre} ${guest.apellidos}, ${guest.confirmacion_asistencia}, ${menuShort(guest.menu_elegido)}`}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60 group-hover:text-foreground" />
      <Avatar name={guest.nombre} surname={guest.apellidos} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold leading-tight">
          {guest.nombre} {guest.apellidos}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", rsvpDot(guest.confirmacion_asistencia))} />
          <span className="truncate">{menuShort(guest.menu_elegido)}</span>
          {guest.alergias_intolerancias ? <span title={guest.alergias_intolerancias}>⚠</span> : null}
        </div>
      </div>
    </button>
  );
}

function VisualTableSlot({
  table,
  number,
  guests,
  isHovered,
  isFull,
  free,
  pickedGuestId,
  pending,
  activeDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickTable,
  onDragStartGuest,
  onDragEndGuest,
  onPickGuest
}: {
  table: Table;
  number: number;
  guests: Guest[];
  isHovered: boolean;
  isFull: boolean;
  free: number;
  pickedGuestId: string | null;
  pending: Set<string>;
  activeDrag: ActiveDrag | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClickTable: () => void;
  onDragStartGuest: (e: React.DragEvent, g: Guest) => void;
  onDragEndGuest: () => void;
  onPickGuest: (g: Guest) => void;
}) {
  const capacity = table.capacidad;
  const radius = 96;
  const center = 120;
  const seats = Array.from({ length: capacity }, (_, i) => guests[i] ?? null);

  const ringClasses = isHovered
    ? "ring-4 ring-success/60 bg-success/10 scale-105"
    : isFull
    ? "ring-4 ring-success/40 bg-success/10"
    : free <= 2
    ? "ring-4 ring-warning/40 bg-warning/10"
    : "ring-4 ring-primary/25 bg-card/90";

  const canDrop = !isFull || (activeDrag && guests.some((g) => g.id === activeDrag.guestId));
  const dropZoneInvalid = isHovered && !canDrop;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClickTable}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-transparent p-3 transition-all",
        isHovered && canDrop && "border-success/50 bg-success/10",
        dropZoneInvalid && "border-destructive/50 bg-destructive/10",
        pickedGuestId && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
      )}
    >
      <div className="relative size-[240px]">
        {seats.map((guest, i) => {
          const angle = (i / capacity) * 2 * Math.PI - Math.PI / 2;
          const x = center + radius * Math.cos(angle) - 18;
          const y = center + radius * Math.sin(angle) - 18;
          return (
            <div
              key={i}
              style={{ left: x, top: y }}
              className="absolute size-9"
            >
              {guest ? (
                <button
                  type="button"
                  draggable={!pending.has(guest.id)}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStartGuest(e, guest);
                  }}
                  onDragEnd={onDragEndGuest}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickGuest(guest);
                  }}
                  title={`${guest.nombre} ${guest.apellidos} (arrastra o toca)`}
                  className={cn(
                    "size-9 cursor-grab rounded-full border-2 border-card text-[11px] font-bold shadow-md transition-all hover:scale-110 hover:z-10 active:cursor-grabbing",
                    hashSeat(guest.id),
                    activeDrag?.guestId === guest.id && "opacity-40 scale-90",
                    pickedGuestId === guest.id && "ring-4 ring-primary scale-125 z-20 animate-pulse",
                    pending.has(guest.id) && "opacity-50"
                  )}
                >
                  {initials(guest)}
                </button>
              ) : (
                <div
                  className={cn(
                    "size-9 rounded-full border-2 border-dashed border-muted-foreground/30 bg-card/40 transition-colors",
                    isHovered && canDrop && "border-success bg-success/15"
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}

        {/* Center disc */}
        <div
          className={cn(
            "absolute inset-[18%] flex flex-col items-center justify-center rounded-full ring-offset-2 ring-offset-background shadow-panel transition-all",
            ringClasses
          )}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Mesa</span>
          <span className="font-display text-3xl leading-none tabular-nums">{number}</span>
          <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {guests.length}/{capacity}
          </span>
        </div>
      </div>

      <div className="w-full text-center">
        <p className="truncate font-display text-base leading-tight">{table.nombre}</p>
        {table.notas ? <p className="truncate text-[10px] text-muted-foreground">{table.notas}</p> : null}
      </div>

      {isHovered && !canDrop ? (
        <p className="absolute inset-x-2 bottom-2 rounded-md bg-destructive px-2 py-1 text-center text-[10px] font-semibold text-destructive-foreground">
          Mesa llena
        </p>
      ) : null}
    </div>
  );
}

export function SeatingPlanLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full bg-success" /> Confirmado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full bg-warning" /> Pendiente
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-full bg-destructive" /> No asiste
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ChefHat className="size-3" /> Menú abreviado bajo el nombre
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span>⚠</span> Tiene alergias o intolerancias
      </span>
    </div>
  );
}
