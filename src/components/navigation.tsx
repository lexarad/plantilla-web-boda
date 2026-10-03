"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, ExternalLink, Search, Sparkles } from "lucide-react";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/admin-nav";
import { getWeddingDetails } from "@/lib/wedding-details";
import { cn } from "@/lib/utils";

/**
 * Ruta activa en el sidebar. Caso especial mesas vs mesas/plano: comparten
 * prefijo `/mesas`, así que se desambiguan explícitamente para no marcar las dos.
 */
function sidebarActive(href: string, pathname: string): boolean {
  if (href === "/mesas/plano") {
    return pathname.startsWith("/mesas/plano");
  }
  if (href === "/mesas") {
    return pathname === "/mesas" || (pathname.startsWith("/mesas/") && !pathname.startsWith("/mesas/plano"));
  }
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function Navigation() {
  const pathname = usePathname();
  const details = getWeddingDetails("es");

  return (
    <nav aria-label="Navegación principal" className="grid gap-4">
      {/* La búsqueda vive como lanzador dedicado (atajo «/») en lugar de un ítem más. */}
      <Link
        href="/busqueda"
        className="group flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Search className="size-4 text-muted-foreground/70 group-hover:text-primary" />
        <span className="flex-1 truncate">Buscar todo</span>
      </Link>

      {ADMIN_NAV_GROUPS.map((grupo) => {
        // La búsqueda ya está arriba como lanzador; no se repite en los grupos.
        const items = ADMIN_NAV.filter((item) => item.grupo === grupo && item.href !== "/busqueda");
        if (items.length === 0) {
          return null;
        }

        return (
          <div key={grupo} className="grid gap-1">
            <p className="px-3 text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground/70">
              {grupo}
            </p>
            <div className="grid gap-0.5">
              {items.map((link) => {
                const Icon = link.icon;
                const isActive = sidebarActive(link.href, pathname);

                return (
                  <Link
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary shadow-sm ring-1 ring-primary/15"
                        : "text-muted-foreground hover:bg-primary/6 hover:text-foreground"
                    )}
                    href={link.href}
                    key={link.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Riel de acento izquierdo */}
                    <span
                      className={cn(
                        "absolute left-0 top-1.5 h-6 w-0.5 rounded-full transition-all",
                        isActive ? "bg-primary" : "bg-transparent group-hover:bg-primary/30"
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary/70"
                      )}
                    />
                    <span className="flex-1 truncate">{link.label}</span>
                    {isActive ? (
                      <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-2 grid gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary/80 transition-colors hover:bg-primary/8"
        >
          <Sparkles className="size-4" />
          <span className="flex-1">Ver portada pública</span>
          <ExternalLink className="size-3 opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
          <CalendarCheck2 className="size-4 shrink-0 text-primary/70" />
          <span className="font-medium">{details.dateLabel}</span>
        </div>
      </div>
    </nav>
  );
}
