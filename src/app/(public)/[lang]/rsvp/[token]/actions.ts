"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { rsvpEditCookieName } from "@/lib/rsvp-edit-cookie";
import { rsvpSchema } from "@/lib/schemas";
import { createRequiredSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { updateDemoRsvp } from "@/lib/demo-store";
import { classifyRsvpError, type RsvpActionResult } from "@/lib/rsvp-errors";
import { resolveLocale } from "@/lib/locale";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// Una confirmación afecta a la página del invitado y al panel
// (dashboard/invitados/catering). Set único para no divergir entre las ramas
// demo y producción.
function revalidateRsvp(token: string, lang: string) {
  revalidatePath(`/${lang}/rsvp/${token}`);
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
  revalidatePath("/catering");
}

/**
 * Devuelve un resultado de error en vez de lanzar: lanzar dejaba al invitado
 * ante la pantalla de error de Next.js, perdiendo todo lo que había escrito.
 * En caso de éxito redirige (no vuelve nunca).
 */
export async function updateRsvpAction(formData: FormData): Promise<RsvpActionResult | void> {
  const parsed = rsvpSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    console.error("[rsvp] datos inválidos:", parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    return { ok: false, code: "datos" };
  }

  const { token, ...rsvpValues } = parsed.data;
  const lang = resolveLocale(String(formData.get("lang") ?? ""));
  // Apellido ya comprobado al desbloquear (ruta rsvp/[token]/desbloquear).
  const apellido = (await cookies()).get(rsvpEditCookieName(token))?.value ?? null;

  if (isDemoMode()) {
    const resultado = await updateDemoRsvp(token, rsvpValues, apellido);

    if (resultado === "apellido") {
      return { ok: false, code: "bloqueado" };
    }
    if (resultado === "no-encontrado") {
      return { ok: false, code: "guardar" };
    }

    revalidateRsvp(token, lang);
    redirect(`/${lang}/rsvp/${token}?ok=1`);
  }

  const supabase = await createRequiredSupabaseServerClient();

  const { error } = await supabase.rpc("actualizar_rsvp_invitado", {
    token_param: token,
    asistencia_param: rsvpValues.confirmacion_asistencia,
    menu_param: rsvpValues.menu_elegido,
    alergias_param: rsvpValues.alergias_intolerancias,
    autobus_param: rsvpValues.necesita_autobus,
    hotel_param: rsvpValues.hotel_alojamiento,
    comentarios_param: rsvpValues.comentarios,
    cancion_param: rsvpValues.cancion_sugerida ?? null,
    apellido_param: apellido
  });

  if (error) {
    console.error("[rsvp] actualizar_rsvp_invitado ha fallado:", error.message);
    return { ok: false, code: classifyRsvpError(error) };
  }

  revalidateRsvp(token, lang);
  redirect(`/${lang}/rsvp/${token}?ok=1`);
}
