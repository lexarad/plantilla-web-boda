import { redirect } from "next/navigation";
import { createRequiredSupabaseServerClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminUser() {
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

  return user;
}
