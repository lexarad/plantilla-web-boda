import Link from "next/link";
import { Menu } from "lucide-react";
import { nombresPareja, type WeddingLocale } from "@/config/boda";
import { SelectorIdioma } from "@/components/publico/selector-idioma";
import { Button } from "@/components/ui/button";
import { menuPublico, rutaPublica, textosWeb } from "@/lib/textos-web";

/**
 * Cabecera de la web de invitados. En escritorio enseña el menú en línea; en
 * móvil lo pliega en un <details>, que funciona sin JavaScript.
 */
export function Cabecera({ locale }: { locale: WeddingLocale }) {
  const t = textosWeb[locale];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={rutaPublica(locale, "inicio")} className="font-display text-base font-semibold tracking-tight">
          {nombresPareja}
        </Link>

        <nav aria-label={t.abrirMenu} className="hidden items-center gap-5 text-sm md:flex">
          {menuPublico.map((seccion) => (
            <Link
              key={seccion}
              href={rutaPublica(locale, seccion)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.menu[seccion]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SelectorIdioma locale={locale} etiqueta={t.idioma} />
          <Button asChild size="sm" className="hidden rounded-md sm:inline-flex">
            <Link href={rutaPublica(locale, "rsvp")}>{t.menu.rsvp}</Link>
          </Button>
          <details className="relative md:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border border-border [&::-webkit-details-marker]:hidden">
              <Menu className="size-4" aria-hidden />
              <span className="sr-only">{t.abrirMenu}</span>
            </summary>
            <nav
              aria-label={t.abrirMenu}
              className="absolute right-0 mt-2 grid w-56 gap-1 rounded-md border border-border bg-card p-2 text-sm shadow-lift"
            >
              {[...menuPublico, "rsvp" as const].map((seccion) => (
                <Link key={seccion} href={rutaPublica(locale, seccion)} className="rounded px-3 py-2 hover:bg-muted">
                  {t.menu[seccion]}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
