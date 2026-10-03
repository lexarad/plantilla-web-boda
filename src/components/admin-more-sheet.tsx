"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ADMIN_NAV_MORE } from "@/lib/admin-nav";

type AdminMoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMoreSheet({ open, onClose }: AdminMoreSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Gestión de foco del diálogo: mover el foco dentro al abrir y devolverlo al
    // disparador al cerrar (WCAG 2.4.3).
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Más opciones admin"
      className="fixed inset-0 z-50 lg:hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-up" />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card shadow-float safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Más
          </p>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="grid grid-cols-3 gap-2 p-4 pb-6">
          {ADMIN_NAV_MORE.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background p-3 text-sm transition-all duration-token ease-standard active:scale-[0.97] hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className="size-6 text-primary" />
              <span className="text-center text-xs font-medium text-foreground">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
