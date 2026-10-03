"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Same event key used by MobileNavToggle / MobileNavOpenButton
const OPEN_EVENT = "boda:nav:open";

export function AdminMobileSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/busqueda?q=${encodeURIComponent(q)}`);
  };

  const openMenu = () => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  };

  return (
    <div className="safe-top sticky top-0 z-30 border-b border-border/60 bg-background/92 backdrop-blur-xl print:hidden lg:hidden">
      <form onSubmit={submit} className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={openMenu}
          aria-label="Abrir menú"
          className="grid size-11 place-items-center rounded-full text-foreground hover:bg-muted active:scale-95"
        >
          <Menu className="size-5" />
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="h-11 pl-9"
          />
        </div>
      </form>
    </div>
  );
}
