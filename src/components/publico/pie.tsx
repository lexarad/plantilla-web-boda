import Link from "next/link";
import { nombresPareja, type WeddingLocale } from "@/config/boda";
import { getWeddingDetails } from "@/lib/wedding-details";
import { menuPublico, rutaPublica, textosWeb } from "@/lib/textos-web";

export function Pie({ locale }: { locale: WeddingLocale }) {
  const t = textosWeb[locale];
  const d = getWeddingDetails(locale);

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {nombresPareja} · {d.dateShort}
        </p>
        <nav aria-label={t.pie} className="flex flex-wrap gap-x-4 gap-y-2">
          {menuPublico.map((seccion) => (
            <Link key={seccion} href={rutaPublica(locale, seccion)} className="hover:text-foreground">
              {t.menu[seccion]}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
