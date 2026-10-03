import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Contenedor estándar de una página de invitados: título + contenido. */
export function Pagina({
  titulo,
  intro,
  locale,
  children,
  className
}: {
  titulo: string;
  intro?: string;
  locale: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main id="main" lang={locale} className={cn("mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14", className)}>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{titulo}</h1>
      {intro ? <p className="mt-3 text-base leading-7 text-muted-foreground">{intro}</p> : null}
      <div className="mt-8 space-y-10">{children}</div>
    </main>
  );
}

/** Bloque con subtítulo dentro de una página. */
export function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}

/** Lista de pares etiqueta/valor (fecha, lugar, hora...). */
export function ListaDatos({ items }: { items: Array<{ etiqueta: string; valor: ReactNode }> }) {
  return (
    <dl className="divide-y divide-border rounded-md border border-border">
      {items.map((item) => (
        <div key={item.etiqueta} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted-foreground">{item.etiqueta}</dt>
          <dd className="text-sm font-medium">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
