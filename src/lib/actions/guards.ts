"use server";

import { redirect } from "next/navigation";
import { isAdminEmail, isDemoAllowed, isDemoMode } from "@/lib/env";
import { createRequiredSupabaseServerClient } from "@/lib/supabase/server";

// Defensa en profundidad para las server actions de mutación del panel: en
// producción sin Supabase isDemoMode() es true, así que un POST directo (sin
// pasar por el layout admin) escribiría en el store demo en memoria sin auth.
// Esta función corta esa rama: solo permite el store demo cuando isDemoAllowed()
// (es decir, en desarrollo local). Devuelve si debe usarse el store demo.
export async function shouldUseDemoStore() {
  if (isDemoMode() && !isDemoAllowed()) {
    throw new Error("Operación no disponible: configura Supabase para gestionar el panel.");
  }

  return isDemoMode();
}

export async function getAdminSupabase() {
  const supabase = await createRequiredSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=no-autorizado");
  }

  return supabase;
}
