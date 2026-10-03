import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/env";
import { WEDDING_LOCALES } from "@/lib/locale";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/es/rsvp/` (con barra) bloquea los enlaces personales de cada
        // invitado; la página `/es/rsvp` (sin barra) sí puede indexarse.
        // Si preferís que la web no salga en Google, cambiad `allow: "/"`
        // por `disallow: "/"`.
        disallow: [
          "/dashboard",
          "/invitados",
          "/mesas",
          "/autobuses",
          "/proveedores",
          "/documentos",
          "/cronograma",
          "/tareas",
          "/presupuesto",
          "/catering",
          "/grupos",
          "/busqueda",
          "/canciones",
          "/ajustes",
          "/login",
          "/auth",
          ...WEDDING_LOCALES.map((locale) => `/${locale}/rsvp/`)
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
