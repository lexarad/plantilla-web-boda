import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { nombresPareja } from "@/config/boda";
import { AdminShell } from "@/components/admin-shell";
import { SetupWarning } from "@/components/setup-warning";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminEmails, hasSupabaseEnv, isDemoAllowed, isDemoMode } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";

export const metadata = {
  title: { template: `%s · ${nombresPareja}`, default: `Panel · ${nombresPareja}` },
  robots: { index: false }
};

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  // En producción sin Supabase el modo demo no está permitido: el panel privado
  // jamás debe renderizarse con datos de ejemplo. Cerramos el acceso al login.
  if (isDemoMode() && !isDemoAllowed()) {
    redirect("/login");
  }

  if (isDemoAllowed()) {
    return (
      <AdminShell userEmail="Modo demo local" demo>
        <Card className="mb-5 border-dashed border-primary/40 bg-primary/5 print:hidden">
          <CardContent className="p-4 text-sm leading-7 text-foreground/80">
            Estás en el panel en modo demo (sin Supabase conectado). Los datos son de ejemplo y se guardan solo en
            este ordenador.
          </CardContent>
        </Card>
        {children}
      </AdminShell>
    );
  }

  if (!hasSupabaseEnv() || getAdminEmails().length === 0) {
    return <SetupWarning />;
  }

  const user = await requireAdminUser();

  return <AdminShell userEmail={user.email ?? "admin"}>{children}</AdminShell>;
}
