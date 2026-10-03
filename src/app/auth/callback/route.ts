import { NextResponse, type NextRequest } from "next/server";
import { createRequiredSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const supabase = await createRequiredSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Enlace mágico caducado/inválido: no redirigir a /dashboard (el layout lo
    // rebotaría a /login sin explicar por qué). Damos feedback explícito.
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
