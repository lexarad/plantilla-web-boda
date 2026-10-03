import { cookies } from "next/headers";
import type { WeddingLocale } from "@/lib/wedding-details";
import { LANG_COOKIE_NAME, resolveLocale } from "@/lib/locale";

// Para Server Components/pages: resuelve el idioma de la petición combinando
// el ?lang recibido (si lo hay) con la cookie sincronizada por el middleware.
export async function getRequestLocale(langParam?: string): Promise<WeddingLocale> {
  const cookieStore = await cookies();
  return resolveLocale(langParam, cookieStore.get(LANG_COOKIE_NAME)?.value);
}
