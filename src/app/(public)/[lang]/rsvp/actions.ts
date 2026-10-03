"use server";

import { redirect } from "next/navigation";
import { getRsvpGuest } from "@/lib/data";
import { isDemoAllowed, isDemoMode } from "@/lib/env";
import { normalizeInvitationCode } from "@/lib/invitation-code";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { z } from "zod";

const openRsvpSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio."),
  lang: z.enum(["es", "ca"]).optional()
});

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function openRsvpAccessAction(formData: FormData) {
  const values = openRsvpSchema.parse(parseFormData(formData));
  const lang = values.lang ?? DEFAULT_LOCALE;

  // En producción sin Supabase no aceptamos los códigos demo de ejemplo: la web
  // todavía no está lista para invitados reales. Devolvemos a la portada.
  if (isDemoMode() && !isDemoAllowed()) {
    redirect(`/${lang}?estado=en-preparacion`);
  }

  const code = normalizeInvitationCode(values.code);
  const guest = await getRsvpGuest(code);

  if (!guest) {
    redirect(`/${lang}/rsvp?error=invalid`);
  }

  redirect(`/${lang}/rsvp/${code}`);
}
