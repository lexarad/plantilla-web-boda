// Errores de la confirmación de asistencia, en el idioma del invitado.
//
// El invitado es la persona MENOS capaz de reaccionar a un fallo técnico: no
// tiene acceso al panel, no sabe qué es Supabase y, si ve una pantalla de
// error, lo más probable es que cierre y no vuelva. Por eso la server action
// nunca lanza: clasifica el fallo a un código estable y la pantalla lo traduce
// a una frase que dice qué hacer, sin perder lo que el invitado había escrito.

import type { WeddingLocale } from "@/lib/wedding-details";

export type RsvpErrorCode = "datos" | "red" | "guardar";

export type RsvpActionResult = { ok: false; code: RsvpErrorCode };

const messages: Record<RsvpErrorCode, Record<WeddingLocale, string>> = {
  datos: {
    es: "Falta algún dato o no se ha entendido alguna respuesta. Revisa el formulario y vuelve a enviarlo; no se ha perdido nada de lo que has escrito.",
    ca: "Falta alguna dada o no s'ha entès alguna resposta. Revisa el formulari i torna a enviar-lo; no s'ha perdut res del que has escrit."
  },
  red: {
    es: "No hemos podido conectar para guardar tu respuesta. Lo que has escrito sigue aquí: espera un momento y vuelve a darle a enviar.",
    ca: "No hem pogut connectar per desar la teva resposta. El que has escrit continua aquí: espera un moment i torna a enviar-ho."
  },
  guardar: {
    es: "No hemos podido guardar tu respuesta. Inténtalo otra vez en un minuto; si sigue sin funcionar, escríbenos y la anotamos nosotros.",
    ca: "No hem pogut desar la teva resposta. Torna-ho a provar d'aquí a un minut; si continua sense funcionar, escriu-nos i l'anotem nosaltres."
  }
};

export function getRsvpErrorMessage(code: RsvpErrorCode, locale: WeddingLocale) {
  return messages[code][locale];
}

/** Un fallo de red se puede reintentar tal cual; el resto puede necesitar corregir algo. */
export function classifyRsvpError(error: { name?: string; message?: string }): RsvpErrorCode {
  const name = error.name ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (
    name === "AuthRetryableFetchError" ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("etimedout") ||
    message.includes("econnrefused") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  ) {
    return "red";
  }

  return "guardar";
}
