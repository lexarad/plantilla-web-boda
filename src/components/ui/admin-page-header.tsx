import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cabecera única de página admin: antetítulo en versales, título, filete fino
 * y hueco de acciones a la derecha. La usan TODAS las páginas.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  as: Heading = "h1",
  className
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Acciones a la derecha (botones, badges). */
  actions?: ReactNode;
  /** Nivel del encabezado; usa "h2" si la página ya tiene otro h1. */
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
        <Heading className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          {title}
        </Heading>
        {/* Filete fino bajo el título. */}
        <div className="mt-3 h-px w-16 bg-primary/70" />
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>
      ) : null}
    </div>
  );
}
