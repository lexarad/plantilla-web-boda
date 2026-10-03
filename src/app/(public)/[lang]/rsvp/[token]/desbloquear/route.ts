import { NextRequest, NextResponse } from "next/server";
import { checkRsvpSurname } from "@/lib/data";
import { resolveLocale } from "@/lib/locale";
import { normalizarApellido, rsvpEditCookieName } from "@/lib/rsvp-edit-cookie";

/**
 * Desbloquea el cambio de una respuesta ya enviada. Es un formulario HTML
 * normal (funciona sin JavaScript): si el apellido coincide, guarda una cookie
 * y vuelve a la página del invitado; si no, vuelve con el aviso de error.
 *
 * La comprobación la hace la base de datos (el apellido no viaja a la web). El
 * apellido normalizado queda en la cookie y se envía con cada cambio, que la
 * base de datos vuelve a validar.
 */
/**
 * Redirección RELATIVA: el navegador la resuelve contra la dirección que está
 * usando. Con una absoluta construida desde request.url, detrás de proxies o
 * en `next start` el host puede salir distinto (p. ej. localhost) y la CSP
 * `form-action 'self'` bloquearía el envío.
 */
function volverA(ruta: string) {
  return new NextResponse(null, { status: 303, headers: { Location: ruta } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ lang: string; token: string }> }) {
  const { lang, token } = await params;
  const locale = resolveLocale(lang);
  const formData = await request.formData();
  const apellido = normalizarApellido(String(formData.get("apellidos") ?? ""));
  const pagina = `/${locale}/rsvp/${encodeURIComponent(token)}`;

  if (!apellido || !(await checkRsvpSurname(token, apellido))) {
    return volverA(`${pagina}?apellido=incorrecto`);
  }

  const respuesta = volverA(pagina);
  respuesta.cookies.set(rsvpEditCookieName(token), apellido, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });
  return respuesta;
}
