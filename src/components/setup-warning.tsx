import { ArrowRight, CheckCircle2, ExternalLink, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    n: 1,
    title: "Crear proyecto en Supabase",
    body: "Ve a supabase.com → New project. Elige una región cercana (Frankfurt va bien para España) y guarda la contraseña de la base.",
    cta: { label: "supabase.com", href: "https://supabase.com" }
  },
  {
    n: 2,
    title: "Ejecutar el SQL",
    body: "En Supabase → SQL Editor → New query. Pega todo el contenido de supabase/schema.sql. Antes de ejecutarlo, sustituye novio1@example.com y novio2@example.com por los emails reales de los organizadores.",
    cta: null
  },
  {
    n: 3,
    title: "Habilitar email (magic link)",
    body: "Authentication → Providers → Email debe estar activo. En URL Configuration añade http://localhost:3000 y la URL de Vercel cuando la tengas.",
    cta: null
  },
  {
    n: 4,
    title: "Copiar credenciales a .env.local",
    body: "Settings → API. Copia URL y anon key. Crea .env.local en la raíz del proyecto con las 3-4 variables de la lista de abajo.",
    cta: null
  },
  {
    n: 5,
    title: "Reiniciar el dev server",
    body: "Ctrl+C y npm run dev otra vez. Vuelve a /login y entra con uno de los emails que pusiste en ADMIN_EMAILS — te llegará un magic link.",
    cta: null
  }
] as const;

const ENV_VARS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", hint: "Project URL (Settings → API)", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", hint: "anon public key (Settings → API)", required: true },
  { key: "ADMIN_EMAILS", hint: "emails de admin separados por coma", required: true },
  { key: "NEXT_PUBLIC_SITE_URL", hint: "Solo en local — en Vercel se autodetecta", required: false }
] as const;

const OPTIONAL_VARS = [
  { key: "RESEND_API_KEY", hint: "Para enviar invitaciones por email" },
  { key: "NEXT_PUBLIC_WEDDING_IBAN", hint: "IBAN para la página /regalo" },
  { key: "NEXT_PUBLIC_WEDDING_IBAN_HOLDER", hint: "Titular del IBAN" },
  { key: "NEXT_PUBLIC_WEDDING_PHONE", hint: "Teléfono de contacto" }
] as const;

export function SetupWarning() {
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden">
          <div className="gradient-shimmer h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <KeyRound className="size-6" />
              </div>
            </div>
            <CardTitle className="font-display text-4xl leading-tight">
              Configura Supabase en 5 pasos
            </CardTitle>
            <p className="text-base leading-7 text-muted-foreground">
              La app funciona en modo demo, pero para conectarla a datos reales (invitados, RSVP, login privado) hay que
              enlazarla con un proyecto de Supabase. Es rápido — unos 10 minutos.
            </p>
          </CardHeader>
        </Card>

        {/* Steps */}
        <ol className="grid gap-3">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-2xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-sm">
                  {step.n}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-2xl leading-tight">{step.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{step.body}</p>
                  {step.cta ? (
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <a href={step.cta.href} target="_blank" rel="noreferrer">
                        {step.cta.label}
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Required env vars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Variables en .env.local (requeridas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {ENV_VARS.map((v) => (
                <li key={v.key} className="grid grid-cols-[1fr_auto] items-baseline gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-sm text-foreground">{v.key}</code>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.hint}</p>
                  </div>
                  {v.required ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">requerida</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">opcional</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Optional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Opcionales (mejoran la experiencia)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {OPTIONAL_VARS.map((v) => (
                <li key={v.key} className="grid grid-cols-[1fr_auto] items-baseline gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-sm text-foreground">{v.key}</code>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.hint}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">opcional</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Las del IBAN y teléfono también se pueden editar después desde{" "}
              <code className="rounded bg-muted px-1 font-mono">/ajustes</code> sin reiniciar.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button asChild>
            <Link href="/">
              <ArrowRight className="size-4 rotate-180" />
              Volver a la portada
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
