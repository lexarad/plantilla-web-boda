import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { contactoTecnico, nombresPareja } from "@/config/boda";
import { requestLoginAction } from "@/lib/actions/auth";
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { getAdminEmails, hasSupabaseEnv, isDemoAllowed } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false }
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ready = hasSupabaseEnv() && getAdminEmails().length > 0;
  // El panel demo solo existe en desarrollo. En producción sin Supabase no se
  // ofrece entrar: el layout del panel redirigiría de vuelta aquí.
  const demoDisponible = isDemoAllowed();
  // Comparación explícita: un error="" sí es un fallo y debe verse igualmente.
  const error = params.error !== undefined ? getLoginErrorMessage(params.error) : null;

  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">{nombresPareja}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Acceso de los organizadores</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Te enviamos un enlace al correo para entrar. Solo funcionan los correos autorizados.
        </p>

        <div className="mt-6 space-y-4">
          {ready ? (
            <form action={requestLoginAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" placeholder="tu@email.com" type="email" autoComplete="email" required />
              </div>
              <Button type="submit" className="rounded-md">
                Enviar enlace de acceso
                <ArrowRight className="size-4" />
              </Button>
            </form>
          ) : demoDisponible ? (
            <div className="grid gap-4">
              <p className="rounded-md border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
                Todavía no hay Supabase conectado, así que el panel abre en modo demo con datos de ejemplo.
              </p>
              <Button asChild className="w-full rounded-md">
                <Link href="/dashboard">
                  Entrar al panel (demo)
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="rounded-md border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
              El acceso todavía no está listo. Avisa a {contactoTecnico} para que termine de conectarlo.
            </p>
          )}

          {params.sent !== undefined ? (
            <p
              className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm leading-6"
              role="status"
            >
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-success" />
              <span>
                Enlace enviado. Si no lo ves en un par de minutos, mira en Spam o Promociones. Solo se puede pedir un
                enlace por minuto.
              </span>
            </p>
          ) : null}

          {error ? (
            <p
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6"
              role="alert"
            >
              <TriangleAlert className="mt-1 size-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
