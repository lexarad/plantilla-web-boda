import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { nombresPareja, textos } from "@/config/boda";
import { Cabecera } from "@/components/publico/cabecera";
import { Pie } from "@/components/publico/pie";
import { WEDDING_LOCALES, isWeddingLocale, resolveLocale } from "@/lib/locale";
import { textosWeb } from "@/lib/textos-web";
import { getWeddingDetails } from "@/lib/wedding-details";

/**
 * El idioma viaja en la URL (/es, /ca). Así las páginas sin datos vivos se
 * generan una vez y se sirven desde la CDN, sin renderizar en cada visita.
 *
 * Esta es la "carcasa" de la web de invitados: cabecera, contenido y pie.
 * Para cambiar el diseño entero, empieza por aquí y por src/components/publico.
 */
export function generateStaticParams() {
  return WEDDING_LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

const openGraphLocale = { es: "es_ES", ca: "ca_ES" } as const;

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const d = getWeddingDetails(locale);

  return {
    title: { default: `${nombresPareja} · ${d.dateShort}`, template: `%s · ${nombresPareja}` },
    description: textos[locale].descripcionSeo,
    openGraph: {
      locale: openGraphLocale[locale],
      alternateLocale: WEDDING_LOCALES.filter((l) => l !== locale).map((l) => openGraphLocale[l])
    },
    alternates: {
      languages: Object.fromEntries(WEDDING_LOCALES.map((l) => [l, `/${l}`]))
    }
  };
}

export default async function PublicLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isWeddingLocale(lang)) {
    notFound();
  }

  return (
    <div lang={lang} className="flex min-h-screen flex-col bg-background">
      {/* El <html> lo pinta el layout raíz, que es estático y no conoce el
          idioma de la rama. Este script corrige el atributo antes del primer
          pintado para que lectores de pantalla y buscadores lo vean bien. */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)}` }} />
      <a href="#main" className="sr-only sr-only-focusable">
        {textosWeb[lang].saltarContenido}
      </a>
      <Cabecera locale={lang} />
      <div className="flex-1">{children}</div>
      <Pie locale={lang} />
    </div>
  );
}
