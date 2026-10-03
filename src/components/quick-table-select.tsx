"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Search, Table2 } from "lucide-react";
import { moveGuestToTableAction } from "@/app/(admin)/mesas/actions";
import { toast } from "@/components/toast-host";
import { cn } from "@/lib/utils";

type Table = {
  id: string;
  nombre: string;
  capacidad: number;
};

export function QuickTableSelect({
  guestId,
  guestName,
  currentMesaId,
  currentMesaName,
  tables,
  guestsCountByTable
}: {
  guestId: string;
  guestName: string;
  currentMesaId: string | null;
  currentMesaName: string | null;
  tables: Table[];
  guestsCountByTable: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(currentMesaId);
  const [selectedName, setSelectedName] = useState(currentMesaName);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(currentMesaId);
    setSelectedName(currentMesaName);
  }, [currentMesaId, currentMesaName]);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  function commit(tableId: string | null, name: string | null) {
    if (tableId === selected) {
      setOpen(false);
      return;
    }
    const previousId = selected;
    const previousName = selectedName;
    setSelected(tableId);
    setSelectedName(name);
    setOpen(false);
    setFilter("");

    const fd = new FormData();
    fd.append("guest_id", guestId);
    if (tableId) fd.append("mesa_id", tableId);

    startTransition(async () => {
      try {
        await moveGuestToTableAction(fd);
        toast({
          type: "success",
          title: `${guestName}`,
          description: tableId ? `Asignado a ${name}` : "Quitado de la mesa"
        });
      } catch (err) {
        setSelected(previousId);
        setSelectedName(previousName);
        toast({
          type: "error",
          title: "No se pudo guardar",
          description: err instanceof Error ? err.message : "Inténtalo de nuevo."
        });
      }
    });
  }

  const filtered = tables.filter((t) => {
    if (!filter) return true;
    return t.nombre.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-card/85 px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5",
          !selected && "border-warning/40 bg-warning/10 text-warning",
          pending && "opacity-60"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Table2 className="size-3" />
        <span className="max-w-[120px] truncate">{selectedName ?? "Sin mesa"}</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-border/60 bg-card p-2 shadow-panel animate-fade-up"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar mesa..."
              className="w-full rounded-lg border border-border/50 bg-background pl-8 pr-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => commit(null, null)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-warning/10",
                !selected && "bg-warning/10 font-semibold"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-warning" />
                Sin mesa
              </span>
              {!selected ? <Check className="size-3 text-warning" /> : null}
            </button>

            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((table) => {
                const occupied = guestsCountByTable[table.id] ?? 0;
                const isFull = occupied >= table.capacidad && selected !== table.id;
                const isSelected = selected === table.id;
                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => commit(table.id, table.nombre)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                      isSelected ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted",
                      isFull && "cursor-not-allowed opacity-50 hover:bg-transparent"
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Table2 className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{table.nombre}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{occupied}/{table.capacidad}</span>
                      {isSelected ? <Check className="size-3 text-primary" /> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
