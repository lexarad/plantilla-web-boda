"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "boda:nav:open";

export function MobileNavToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escHandler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity print:hidden lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] overflow-y-auto border-r border-border/60 bg-card/95 px-5 py-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 print:hidden lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
        aria-label="Menú lateral"
        inert={!open}
      >
        <div className="mb-3 flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </aside>
    </>
  );
}

export function MobileNavOpenButton() {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label="Abrir menú"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EVENT))}
    >
      <Menu className="size-4" />
    </Button>
  );
}
