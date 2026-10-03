import { idiomas, type WeddingLocale } from "@/config/boda";

// El idioma vive en la URL: /es/... y /ca/... Así cada idioma es una rama de
// rutas que se genera una vez y se sirve desde la CDN.
// La cookie solo recuerda la preferencia para redirigir desde /.
// Módulo PURO (sin next/headers) para poder importarse desde el middleware
// edge; el helper de servidor vive en locale-server.ts.
export const LANG_COOKIE_NAME = "boda-lang";

/** Los idiomas publicados, en el orden en que se generan las rutas. */
export const WEDDING_LOCALES: readonly WeddingLocale[] = idiomas;

/** Idioma principal: el primero de la lista de src/config/boda.ts. */
export const DEFAULT_LOCALE: WeddingLocale = idiomas[0] ?? "es";

export function isWeddingLocale(value: unknown): value is WeddingLocale {
  return typeof value === "string" && (WEDDING_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(param?: string | null, cookieValue?: string | null): WeddingLocale {
  const fromParam = param?.toLowerCase();
  if (isWeddingLocale(fromParam)) return fromParam;

  const fromCookie = cookieValue?.toLowerCase();
  if (isWeddingLocale(fromCookie)) return fromCookie;

  return DEFAULT_LOCALE;
}
