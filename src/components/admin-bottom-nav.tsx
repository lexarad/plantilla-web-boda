"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { AdminMoreSheet } from "@/components/admin-more-sheet";
import { ADMIN_NAV_BOTTOM, ADMIN_PREFIXES, isNavItemActive } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export function AdminBottomNav() {
  const pathname = usePathname() ?? "/";
  const [moreOpen, setMoreOpen] = useState(false);

  // Sólo se renderiza dentro del panel admin.
  if (!ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const isMoreActive = !ADMIN_NAV_BOTTOM.some((item) => isNavItemActive(item.href, pathname));

  return (
    <>
      <nav
        aria-label="Navegación admin"
        className="fixed inset-x-3 bottom-3 z-40 print:hidden lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 gap-1 rounded-3xl border border-border/60 bg-background/94 p-2 shadow-panel backdrop-blur-xl">
          {ADMIN_NAV_BOTTOM.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-colors duration-token ease-standard active:scale-95",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 h-1 w-1 rounded-full transition-opacity",
                    active ? "bg-primary opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Más opciones admin"
            aria-expanded={moreOpen}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-colors duration-token ease-standard active:scale-95",
              isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">Más</span>
            <span
              className={cn(
                "mt-0.5 h-1 w-1 rounded-full transition-opacity",
                isMoreActive ? "bg-primary opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
      <AdminMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
