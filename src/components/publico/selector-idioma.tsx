"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WeddingLocale } from "@/config/boda";
import { WEDDING_LOCALES } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Cambia el prefijo de idioma de la ruta actual (/es/programa → /ca/programa).
 * Si solo hay un idioma publicado no pinta nada.
 */
export function SelectorIdioma({ locale, etiqueta }: { locale: WeddingLocale; etiqueta: string }) {
  const pathname = usePathname() ?? `/${locale}`;

  if (WEDDING_LOCALES.length < 2) {
    return null;
  }

  const resto = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  return (
    <nav aria-label={etiqueta} className="flex items-center gap-1 text-xs font-medium">
      {WEDDING_LOCALES.map((opcion) => (
        <Link
          key={opcion}
          href={`/${opcion}${resto}`}
          hrefLang={opcion}
          aria-current={opcion === locale ? "true" : undefined}
          className={cn(
            "rounded px-2 py-1 uppercase",
            opcion === locale ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opcion}
        </Link>
      ))}
    </nav>
  );
}
