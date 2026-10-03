"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/schemas";
import { classifyAuthError } from "@/lib/auth-errors";
import { getSupabaseEnv, isAdminEmail, isDemoMode } from "@/lib/env";
import { createRequiredSupabaseServerClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestLoginAction(formData: FormData) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const env = getSupabaseEnv();

  if (!env) {
    redirect("/login?error=supabase");
  }

  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    redirect("/login?error=email");
  }

  const email = result.data.email;
  if (!isAdminEmail(email)) {
    redirect("/login?error=no-autorizado");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createRequiredSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) {
    // El detalle técnico se queda en los logs del servidor; a la pantalla de
    // login solo viaja un código conocido, nunca el mensaje en inglés.
    console.error("[login] signInWithOtp ha fallado:", error.name, error.message);
    redirect(`/login?error=${classifyAuthError(error)}`);
  }

  redirect("/login?sent=1");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
