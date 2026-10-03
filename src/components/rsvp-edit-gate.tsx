import { Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeddingLocale } from "@/lib/wedding-details";

const T = {
  title: {
    es: "¿Quieres cambiar algo?",
    ca: "Vols canviar alguna cosa?"
  },
  copy: {
    es: "Esta invitación ya está respondida. Escribe tu apellido y podrás modificarla.",
    ca: "Aquesta invitació ja està resposta. Escriu el teu cognom i la podràs modificar."
  },
  label: { es: "Tu apellido", ca: "El teu cognom" },
  action: { es: "Continuar", ca: "Continuar" },
  error: {
    es: "El apellido no coincide. Escríbelo tal como aparece en la invitación o pide a los novios que lo cambien.",
    ca: "El cognom no coincideix. Escriu-lo tal com apareix a la invitació o demana als nuvis que el canviïn."
  }
} as const;

/**
 * El enlace personal es la única credencial del invitado y se reenvía con
 * facilidad. Responder por primera vez no pide nada; CAMBIAR una respuesta ya
 * enviada pide el apellido. Formulario HTML normal hacia la ruta
 * `rsvp/[token]/desbloquear`, que funciona también sin JavaScript.
 */
export function RsvpEditGate({ token, locale, error }: { token: string; locale: WeddingLocale; error?: boolean }) {
  return (
    <form method="post" action={`/${locale}/rsvp/${encodeURIComponent(token)}/desbloquear`} className="grid gap-4">
      <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
        <Lock className="mt-1 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">{T.title[locale]}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{T.copy[locale]}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apellidos">{T.label[locale]}</Label>
        <Input
          id="apellidos"
          name="apellidos"
          required
          autoComplete="family-name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "apellidos-error" : undefined}
        />
      </div>

      {error ? (
        <p
          id="apellidos-error"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-foreground"
          role="alert"
        >
          <TriangleAlert className="mt-1 size-4 shrink-0 text-destructive" />
          <span>{T.error[locale]}</span>
        </p>
      ) : null}

      <Button type="submit" className="rounded-md">
        {T.action[locale]}
      </Button>
    </form>
  );
}
