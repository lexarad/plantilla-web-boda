import type { WeddingLocale } from "@/lib/wedding-details";

/**
 * Enlace personal de invitación.
 *
 * Desde que el idioma vive en la ruta, los enlaces que salen hacia los
 * invitados (QR impresos, WhatsApp, correo) deben llevar ya el idioma: sin él
 * funcionan igual, pero pagan una redirección extra en el móvil del invitado
 * — y un QR impreso no se puede corregir después.
 */
export function buildRsvpUrl(siteUrl: string, codigo: string, locale: WeddingLocale = "es") {
  return `${siteUrl}/${locale}/rsvp/${codigo}`;
}
