import { isDemoMode } from "@/lib/env";
import { trackDemoRsvpView } from "@/lib/demo-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeddingLocale } from "@/lib/wedding-details";

export async function recordRsvpView(token: string, locale: WeddingLocale) {
  if (isDemoMode()) {
    await trackDemoRsvpView(token, locale);
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("registrar_acceso_rsvp", {
    token_param: token,
    locale_param: locale
  });

  // El registro de vista es best-effort: NUNCA debe propagar el error. Si lo
  // hiciera, un token inválido devolvería 500 y el endpoint /rsvp/[token]/track
  // se convertiría en un oráculo de enumeración (500 = no existe, 200 = existe).
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[rsvp-tracking] registrar_acceso_rsvp:", error.message);
  }
}
