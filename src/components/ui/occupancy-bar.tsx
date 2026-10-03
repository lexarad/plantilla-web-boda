import { cn } from "@/lib/utils";

export type OccupancySize = "sm" | "md";

/**
 * Tono de ocupación por ratio (0..1+): éxito hasta 0,8; aviso de 0,8 a 1;
 * destructivo por encima de la capacidad. Antes duplicado en mesas y autobuses.
 */
export function occupancyBarClass(ratio: number): string {
  if (ratio > 1) {
    return "bg-destructive";
  }
  if (ratio >= 0.8) {
    return "bg-warning";
  }
  return "bg-success";
}

/** Barra de ocupación con color por umbral, altura configurable y % accesible. */
export function OccupancyBar({
  used,
  capacity,
  size = "md",
  label,
  className
}: {
  used: number;
  capacity: number;
  size?: OccupancySize;
  /** aria-label a medida; por defecto «X de Y ocupados (Z%)». */
  label?: string;
  className?: string;
}) {
  const hasCapacity = capacity > 0;
  const ratio = hasCapacity ? used / capacity : 0;
  const pct = Math.round(ratio * 100);
  const width = Math.min(Math.max(ratio, 0), 1) * 100;
  const barClass = hasCapacity ? occupancyBarClass(ratio) : "bg-muted-foreground/25";
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(Math.max(pct, 0), 100)}
      aria-label={label ?? `${used} de ${capacity} ocupados (${pct}%)`}
      className={cn("overflow-hidden rounded-full bg-muted", height, className)}
    >
      <div className={cn("h-full rounded-full transition-all duration-300", barClass)} style={{ width: `${width}%` }} />
    </div>
  );
}
