// Única fuente de verdad de los errores de acceso al panel.
//
// Supabase devuelve los fallos como texto técnico en inglés dentro de
// `error.message` ("fetch failed", "For security purposes, you can only request
// this after 57 seconds."...). Si ese texto viaja a la URL y se pinta tal cual,
// los organizadores leen jerga que no les dice qué hacer (ocurrió de verdad con
// "fetch failed" cuando el proyecto de Supabase estaba pausado). Por eso el
// servidor clasifica el error a un CÓDIGO corto y estable, y la pantalla solo
// traduce códigos conocidos a español claro.

import { contactoTecnico } from "@/config/boda";

export type LoginErrorCode =
  | "supabase"
  | "email"
  | "no-autorizado"
  | "auth"
  | "red"
  | "rate-limit"
  | "desconocido";

/** Forma mínima del error de Supabase Auth que necesitamos para clasificar. */
type AuthErrorLike = {
  name?: string;
  message?: string;
  status?: number;
};

const loginErrorMessages: Record<string, string> = {
  supabase: `El acceso no está listo todavía. Avisa a ${contactoTecnico}.`,
  email: "Introduce un correo válido.",
  "no-autorizado": "Ese correo no está autorizado como administrador.",
  auth: "El enlace de acceso ha caducado o no es válido. Pide uno nuevo.",
  red: `El servidor de acceso no responde ahora mismo. Espera unos minutos y vuelve a intentarlo; si sigue igual, avisa a ${contactoTecnico} para revisar el servidor.`,
  // Sin prometer un minuto exacto: el límite corto es de 60 s, pero la cuota de
  // correos del proyecto puede tardar hasta una hora en liberarse, y mandar a
  // reintentar cada minuto contra ese muro solo genera frustración.
  "rate-limit":
    "Ya se ha pedido un enlace hace muy poco. Busca el que ya te llegó (mira también en Spam); si has pedido varios seguidos, puede tardar un rato en dejar pedir otro."
};

/** Mensaje para cualquier fallo que no sepamos identificar: nunca jerga en inglés. */
export const genericLoginErrorMessage =
  `No se ha podido enviar el enlace. Avisa a ${contactoTecnico} para que lo revise; mientras, puedes probar otra vez por si fue algo puntual.`;

/**
 * Clasifica el error crudo de Supabase Auth en un código corto y estable.
 * Los fallos de red no llegan como excepción: auth-js los captura y los
 * devuelve como AuthRetryableFetchError con el mensaje "fetch failed".
 */
export function classifyAuthError(error: AuthErrorLike): LoginErrorCode {
  const name = error.name ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (
    error.status === 429 ||
    message.includes("rate limit") ||
    message.includes("only request this after") ||
    message.includes("too many requests")
  ) {
    return "rate-limit";
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

  return "desconocido";
}

/** Traduce el código de la URL a un mensaje en español; nunca devuelve el texto recibido. */
export function getLoginErrorMessage(code: string): string {
  return loginErrorMessages[code] ?? genericLoginErrorMessage;
}
