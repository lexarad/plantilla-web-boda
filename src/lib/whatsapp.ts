/**
 * Enlace `wa.me` para abrir WhatsApp con un mensaje precargado (sin destinatario fijo).
 * No hace falta `.replace(/\+/g, "%20")`: encodeURIComponent ya codifica los espacios como %20.
 */
export function buildWhatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
