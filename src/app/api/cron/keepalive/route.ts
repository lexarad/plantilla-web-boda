import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

// Cron diario (vercel.json) que mantiene despierto el proyecto de Supabase.
// El plan gratuito lo pausa tras ~7 días sin actividad y entonces el login de
// los organizadores falla con "fetch failed" hasta que alguien lo reactiva a
// mano. Una petición diaria cuenta como actividad y evita la pausa.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel firma sus crons con CRON_SECRET si la variable existe. Si no está
  // configurada, la ruta es pública pero inocua (solo hace lecturas triviales).
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 });
  }

  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json({ ok: false, error: "sin configuracion de supabase" }, { status: 503 });
  }

  const checks: Record<string, number | string> = {};

  try {
    const health = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.anonKey },
      cache: "no-store"
    });
    checks.auth = health.status;

    // Lectura mínima contra PostgREST. Con RLS activo puede devolver 200 con
    // lista vacía o 401: cualquiera de las dos cuenta como actividad, que es
    // lo único que necesitamos aquí.
    const rest = await fetch(`${env.url}/rest/v1/invitados?select=id&limit=1`, {
      headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
      cache: "no-store"
    });
    checks.rest = rest.status;
  } catch (error) {
    checks.error = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ ok: false, checks }, { status: 502 });
  }

  const ok = checks.auth === 200;
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 502 });
}
