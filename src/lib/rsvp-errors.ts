// Errores de la confirmación de asistencia, en el idioma del invitado.
//
// El invitado no tiene acceso al panel ni sabe qué hay detrás: si ve un error
// técnico, lo normal es que cierre y no vuelva. Por eso la server action nunca
// lanza: convierte el fallo en un código estable y la pantalla lo traduce a
// una frase que dice qué hacer, conservando lo que el invitado había escrito.

import type { WeddingLocale } from "@/lib/wedding-details";

export type RsvpErrorCode = "datos" | "red" | "guardar" | "bloqueado";

export type RsvpActionResult = { ok: false; code: RsvpErrorCode };

const messages: Record<RsvpErrorCode, Record<WeddingLocale, string>> = {
  datos: {
    es: "Hay algún campo que no hemos podido leer. Repásalo y envíalo otra vez: tus respuestas siguen en el formulario.",
    ca: "Hi ha algun camp que no hem pogut llegir. Repassa'l i torna a enviar-lo: les teves respostes continuen al formulari."
  },
  red: {
    es: "Se ha cortado la conexión al enviar. Tus respuestas siguen en el formulario: espera unos segundos y pulsa enviar de nuevo.",
    ca: "S'ha tallat la connexió en enviar. Les teves respostes continuen al formulari: espera uns segons i torna a prémer enviar."
  },
  guardar: {
    es: "No ha sido posible guardar ahora mismo. Prueba de nuevo en un rato y, si vuelve a pasar, avísanos y lo apuntamos a mano.",
    ca: "No ha estat possible desar ara mateix. Torna-ho a provar d'aquí a una estona i, si torna a passar, avisa'ns i ho apuntem a mà."
  },
  bloqueado: {
    es: "Esta invitación ya tiene una respuesta. Para cambiarla, recarga la página y escribe primero tu apellido.",
    ca: "Aquesta invitació ja té una resposta. Per canviar-la, recarrega la pàgina i escriu primer el teu cognom."
  }
};

export function getRsvpErrorMessage(code: RsvpErrorCode, locale: WeddingLocale) {
  return messages[code][locale];
}

/** Un fallo de red se puede reintentar tal cual; el resto puede necesitar corregir algo. */
export function classifyRsvpError(error: { name?: string; message?: string }): RsvpErrorCode {
  const name = error.name ?? "";
  const message = (error.message ?? "").toLowerCase();

  // La base de datos exige el apellido para cambiar una respuesta ya enviada.
  if (message.includes("apellido requerido")) {
    return "bloqueado";
  }

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
