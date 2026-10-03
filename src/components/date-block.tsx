import { cn } from "@/lib/utils";

const monthLabelsEs = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const monthLabelsCa = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];
const weekdayLabelsEs = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const weekdayLabelsCa = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"];

export function DateBlock({
  iso,
  locale = "es",
  variant = "card",
  className
}: {
  iso: string;
  locale?: "es" | "ca";
  variant?: "card" | "inline";
  className?: string;
}) {
  const date = new Date(iso);
  const day = date.getDate();
  const month = locale === "ca" ? monthLabelsCa[date.getMonth()] : monthLabelsEs[date.getMonth()];
  const year = date.getFullYear();
  const weekday = locale === "ca" ? weekdayLabelsCa[date.getDay()] : weekdayLabelsEs[date.getDay()];

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-baseline gap-2", className)}>
        <span className="font-display text-3xl leading-none tabular-nums">{day}</span>
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">{month}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{year}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-panel backdrop-blur-xl",
        className
      )}
    >
      <div className="w-full bg-gradient-to-r from-primary via-secondary to-accent px-4 py-1 text-center text-[10px] font-bold uppercase tracking-[0.32em] text-primary-foreground">
        {weekday}
      </div>
      <div className="flex flex-col items-center px-6 py-3">
        <span className="font-display text-5xl leading-none text-primary tabular-nums">{day}</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.32em] text-muted-foreground">{month}</span>
        <span className="mt-0.5 text-[10px] font-semibold tracking-[0.3em] text-muted-foreground/80 tabular-nums">
          {year}
        </span>
      </div>
    </div>
  );
}
