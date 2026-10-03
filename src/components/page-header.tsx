import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary/70">{eyebrow}</p>
        <h2 className="font-display text-gradient mt-1 text-4xl leading-tight sm:text-5xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-primary/60 to-transparent" />
          <span className="text-[10px] text-primary/35">✦</span>
          <div className="h-px w-6 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{children}</div>
      )}
    </div>
  );
}
