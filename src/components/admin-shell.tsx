import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut, Search } from "lucide-react";
import { nombresPareja } from "@/config/boda";
import { signOutAction } from "@/lib/actions/auth";
import { Navigation } from "@/components/navigation";
import { MobileNavToggle } from "@/components/mobile-nav-toggle";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { AdminBottomNav } from "@/components/admin-bottom-nav";
import { AdminMobileSearchBar } from "@/components/admin-mobile-search-bar";
import { getWeddingDetails } from "@/lib/wedding-details";

interface AdminShellProps {
  children: ReactNode;
  userEmail: string;
  demo?: boolean;
}

function SidebarContent() {
  const d = getWeddingDetails("es");
  return (
    <>
      {/* Marca del panel */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.dateShort}</p>
        <p className="mt-1 font-display text-2xl font-semibold leading-tight">{nombresPareja}</p>
        <p className="mt-1 text-xs text-muted-foreground">Panel privado de organización</p>
      </div>

      <Navigation />
    </>
  );
}

export function AdminShell({ children, userEmail, demo = false }: AdminShellProps) {
  return (
    // text-foreground en el wrapper es clave: el color del body es tinta fija (web
    // pública) y todo texto sin clase la hereda — en oscuro sería tinta sobre tinta.
    <div data-theme="admin" className="min-h-screen bg-background text-foreground">
      {/* Evita el destello claro en modo Auto: ThemeNoFlashScript (theme-toggle.tsx)
          solo aplica `.dark` si el usuario eligió "dark" explícitamente, porque la
          web pública no debe invertirse por prefers-color-scheme. El panel admin sí
          soporta modo Auto, así que necesita su propio script síncrono, scopeado
          aquí (solo páginas admin) para no tocar el comportamiento público. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var s=localStorage.getItem('boda-theme');if((s===null||s==='auto')&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}"
        }}
      />
      <KeyboardShortcuts />
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[288px_minmax(0,1fr)] print:block">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-border/60 bg-card/80 px-5 py-5 backdrop-blur-2xl print:hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Mobile drawer (client) */}
        <MobileNavToggle>
          <SidebarContent />
        </MobileNavToggle>

        {/* Mobile sticky search bar — hidden on desktop */}
        <AdminMobileSearchBar />

        {/* Main content area */}
        <main id="main" className="min-w-0 px-4 py-5 pb-mobile-nav sm:px-6 lg:px-8 lg:pb-5">
          {/* Top bar */}
          <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm backdrop-blur-xl print:hidden sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* En móvil el botón de abrir menú ya vive en AdminMobileSearchBar
                  (barra superior fija); duplicarlo aquí confundía con dos ≡ apilados. */}
              <div className="min-w-0 truncate">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                  Sesión administradora
                  {demo ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-warning">
                      <span className="size-1.5 rounded-full bg-warning animate-pulse-soft" />
                      Demo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      En vivo
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón explícito en vez del hint de teclado "/" (irreconocible
                  para una audiencia que no usa atajos): icono + texto claros. */}
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
                <Link href="/busqueda">
                  <Search className="size-4" />
                  Buscar
                </Link>
              </Button>
              <ThemeToggle />
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-4" />
                  Salir
                </Button>
              </form>
            </div>
          </header>
          {children}

          {/* Mini footer admin */}
          <footer className="mt-10 border-t border-border/60 pt-5 text-xs text-muted-foreground print:hidden">
            <p>Panel privado de organización · {nombresPareja}</p>
          </footer>
        </main>
      </div>

      {/* Admin bottom nav — mobile only, scoped to admin routes */}
      <AdminBottomNav />
    </div>
  );
}
