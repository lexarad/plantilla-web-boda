import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/env";
import { WEDDING_LOCALES } from "@/lib/locale";
import { rutasPublicas } from "@/lib/textos-web";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicBaseUrl();

  // El idioma vive en la ruta: /es/..., /ca/...
  return WEDDING_LOCALES.flatMap((locale, index) =>
    Object.values(rutasPublicas).map((ruta) => ({
      url: `${base}/${locale}${ruta}`,
      changeFrequency: "monthly" as const,
      priority: (ruta === "" ? 1 : 0.7) - index * 0.1
    }))
  );
}
