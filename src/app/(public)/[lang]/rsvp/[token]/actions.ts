"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRsvpGuest } from "@/lib/data";
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

/** Compara apellidos ignorando mayúsculas, acentos y espacios de más. */
function mismoApellido(a: string, b: string) {
  const normaliza = (valor: string) =>
    valor
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  return normaliza(a) === normaliza(b) && normaliza(a).length > 0;
}

/**
 * Desbloquea la edición de una respuesta ya enviada. Confirmar por primera vez
 * no pasa por aquí: la fricción solo aparece al MODIFICAR, que es donde duele
 * que un enlace reenviado por WhatsApp cambie los datos de otra persona.
 */
export async function unlockRsvpEditAction(formData: FormData): Promise<{ ok: boolean }> {
  const token = String(formData.get("token") ?? "");
  const apellidos = String(formData.get("apellidos") ?? "");

  if (!token || !apellidos) {
    return { ok: false };
  }

  const guest = await getRsvpGuest(token);

  if (!guest || !mismoApellido(guest.apellidos, apellidos)) {
    return { ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(rsvpEditCookieName(token), "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });

  revalidatePath(`/${resolveLocale(String(formData.get("lang") ?? ""))}/rsvp/${token}`);
  return { ok: true };
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

  if (isDemoMode()) {
    await updateDemoRsvp(token, rsvpValues);

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
    cancion_param: rsvpValues.cancion_sugerida ?? null
  });

  if (error) {
    console.error("[rsvp] actualizar_rsvp_invitado ha fallado:", error.message);
    return { ok: false, code: classifyRsvpError(error) };
  }

  revalidateRsvp(token, lang);
  redirect(`/${lang}/rsvp/${token}?ok=1`);
}
