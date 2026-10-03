import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { classifyAuthError } from "@/lib/auth-errors";
import { getSupabaseEnv, isAdminEmail } from "@/lib/env";

// Solo el panel privado (grupo de rutas (admin)) exige sesión de administrador.
// TODO el resto del sitio —las páginas públicas de la boda— debe ser accesible
// sin login. Se usa una allow-list INVERSA (rutas protegidas) en lugar de una
// lista de rutas públicas: así, añadir una nueva página pública no vuelve a
// romper el acceso, y el fallo por defecto es "público" para la web de invitados.
const protectedPrefixes = [
  "/dashboard",
  "/invitados",
  "/mesas",
  "/catering",
  "/autobuses",
  "/proveedores",
  "/documentos",
  "/presupuesto",
  "/tareas",
  "/canciones",
  "/ajustes",
  "/grupos",
  "/cronograma",
  "/busqueda"
];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  let response = NextResponse.next({ request });

  if (!env) {
    // Sin Supabase solo existe el modo demo, que es solo para desarrollo local.
    // En producción el panel se cierra AQUÍ, antes de renderizar nada: si se
    // dejara al layout, la página ya habría cargado los datos en paralelo.
    if (process.env.NODE_ENV === "production" && isProtectedPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Las páginas públicas de la boda no requieren sesión: pasan siempre, sin
  // siquiera consultar a Supabase Auth (evita una llamada de red por request
  // en el primer render de cada página pública).
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Si Supabase no responde, getUser() devuelve user=null sin lanzar error:
    // parecería que la sesión ha caducado. Se avisa de que es un fallo temporal.
    if (error && classifyAuthError(error) === "red") {
      url.searchParams.set("error", "red");
    }
    return NextResponse.redirect(url);
  }

  if (!isAdminEmail(user.email)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "no-autorizado");
    return NextResponse.redirect(url);
  }

  return response;
}
