import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { DEFAULT_LOCALE, isWeddingLocale, LANG_COOKIE_NAME } from "@/lib/locale";

const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

/**
 * Secciones públicas que viven bajo /es, /ca. Si añades una página nueva en
 * src/app/(public)/[lang]/, añádela aquí y en el `matcher` de abajo para que
 * /<seccion> sin idioma redirija a /es/<seccion>.
 */
const RUTAS_PUBLICAS = ["agenda", "informacion", "mapa", "regalo", "rsvp"];

/** /agenda/foto.jpg es un archivo de /public, no una página: no se toca. */
function esArchivo(pathname: string) {
  return /\.[a-z0-9]{2,5}$/i.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1) El idioma vive en la URL. La raíz y las direcciones sin idioma
  // (/agenda, /agenda?lang=ca) se redirigen a su versión con idioma,
  // respetando lo que pidió el visitante o lo que recuerde su cookie.
  const primerSegmento = pathname.split("/")[1] ?? "";
  if (pathname === "/" || (RUTAS_PUBLICAS.includes(primerSegmento) && !esArchivo(pathname))) {
    const pedido = searchParams.get("lang")?.toLowerCase();
    const recordado = request.cookies.get(LANG_COOKIE_NAME)?.value;
    const destinoLang = isWeddingLocale(pedido) ? pedido : isWeddingLocale(recordado) ? recordado : DEFAULT_LOCALE;

    const destino = request.nextUrl.clone();
    destino.pathname = `/${destinoLang}${pathname === "/" ? "" : pathname}`;
    destino.searchParams.delete("lang");
    return NextResponse.redirect(destino, 308);
  }

  // 2) Sesión de Supabase (refresca cookies del panel).
  const response = await updateSession(request);

  // 3) Recordar el idioma elegido para poder redirigir bien desde la raíz.
  if (isWeddingLocale(primerSegmento)) {
    response.cookies.set(LANG_COOKIE_NAME, primerSegmento, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: LANG_COOKIE_MAX_AGE
    });
  }

  return response;
}

// El middleware solo corre donde hace algo: la raíz y las direcciones sin
// idioma (redirección), el RSVP (cookie de idioma) y el panel (sesión).
// Las páginas públicas estáticas salen directamente de la CDN.
export const config = {
  matcher: [
    "/",
    "/(agenda|informacion|mapa|regalo|rsvp)",
    "/(agenda|informacion|mapa|regalo|rsvp)/:path*",
    "/(es|ca)/rsvp/:path*",
    "/login",
    "/auth/:path*",
    "/(dashboard|invitados|mesas|autobuses|proveedores|documentos|cronograma|tareas|presupuesto|catering|grupos|busqueda|canciones|ajustes)",
    "/(dashboard|invitados|mesas|autobuses|proveedores|documentos|cronograma|tareas|presupuesto|catering|grupos|busqueda|canciones|ajustes)/:path*"
  ]
};
