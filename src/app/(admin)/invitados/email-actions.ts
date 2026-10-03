"use server";

import { z } from "zod";
import { getGuestById } from "@/lib/data";
import { getSiteUrl } from "@/lib/env";
import { sendInvitationEmail } from "@/lib/email";
import { getWeddingDetails } from "@/lib/wedding-details";
import { isDemoAllowed, isDemoMode } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";
import { buildRsvpUrl } from "@/lib/rsvp-link";

const sendSchema = z.object({ guest_id: z.string().uuid() });

export async function sendInvitationEmailAction(formData: FormData) {
  // Producción sin Supabase: no permitir el envío sin autenticar.
  if (isDemoMode() && !isDemoAllowed()) {
    return { ok: false as const, message: "Operación no disponible: configura Supabase." };
  }
  // Fuera del demo local (dev), exigir sesión de admin.
  if (!isDemoMode()) {
    await requireAdminUser();
  }

  const { guest_id } = sendSchema.parse(Object.fromEntries(formData.entries()));
  const [guest, siteUrl] = await Promise.all([getGuestById(guest_id), getSiteUrl()]);

  if (!guest) {
    return { ok: false as const, message: "Invitado no encontrado." };
  }

  if (!guest.email) {
    return { ok: false as const, message: "El invitado no tiene correo registrado." };
  }

  const details = getWeddingDetails("es");
  const rsvpUrl = buildRsvpUrl(siteUrl, guest.codigo_invitacion);

  const result = await sendInvitationEmail({
    toEmail: guest.email,
    guestName: `${guest.nombre} ${guest.apellidos}`.trim(),
    rsvpUrl,
    rsvpDeadline: details.rsvpDeadline,
    dateLabel: details.dateLabel,
    venueName: details.venueName
  });

  if (!result.ok) {
    if (result.reason === "no_resend") {
      return { ok: false as const, message: "Correo no enviado: configura RESEND_API_KEY en las variables de entorno." };
    }
    return { ok: false as const, message: result.message };
  }

  return { ok: true as const, message: `Correo enviado a ${guest.email}.` };
}
