import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "success" | "warning" | "info" | "destructive";

const toneBadge: Record<StatTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive"
};

/**
 * Stat unificado del panel: icono en badge circular, valor tabular-nums grande,
 * label en versales y nota/delta opcional. Reemplaza los layouts de stat ad hoc.
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  note,
  tone = "default",
  className
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  note?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-panel",
        className
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", toneBadge[tone])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {/* lining-nums evita que el "1" de fuentes con cifras de estilo antiguo se lea como "I". */}
        <p className="font-display text-3xl leading-none tabular-nums lining-nums text-foreground">{value}</p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        {note ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  );
}
