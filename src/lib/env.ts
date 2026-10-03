import { headers } from "next/headers";

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isDemoMode() {
  return !hasSupabaseEnv();
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

// El modo demo (admin abierto, códigos RSVP de ejemplo) solo es legítimo en
// desarrollo local. En producción sin Supabase NO debe activarse jamás: dejaría
// el panel privado expuesto a cualquiera.
export function isDemoAllowed() {
  return isDemoMode() && !isProduction();
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

// URL base pública de MARCA para metadata, sitemap y robots. Precedencia única
// (antes divergía entre layout.tsx y sitemap/robots, dejando og:url en el host
// efímero del deployment mientras el sitemap apuntaba al dominio configurado):
// 1) NEXT_PUBLIC_SITE_URL (lo que configura el usuario), 2) VERCEL_URL, 3) local.
export function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

// URL base para los ENLACES que salen de la app (emails de invitación, listas
// de WhatsApp). En producción manda la configuración: un x-forwarded-host
// manipulado por el cliente no debe acabar en el enlace que recibe un invitado.
// El host de la petición queda solo como comodidad de desarrollo (p.ej. abrir
// el dev server desde el móvil vía IP de la LAN).
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (host) {
    const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  return apiKey ? { apiKey, from } : null;
}
