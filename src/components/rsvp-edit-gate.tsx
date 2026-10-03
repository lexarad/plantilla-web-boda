"use client";

import { useState } from "react";
import { Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeddingLocale } from "@/lib/wedding-details";

const T = {
  title: {
    es: "Para cambiar tu respuesta, confirma que eres tú",
    ca: "Per canviar la teva resposta, confirma que ets tu"
  },
  copy: {
    es: "Ya nos enviaste tu respuesta. Como el enlace de invitación a veces se reenvía por WhatsApp sin querer, para modificarla necesitamos tu apellido.",
    ca: "Ja ens vas enviar la teva resposta. Com que l'enllaç d'invitació de vegades es reenvia per WhatsApp sense voler, per modificar-la necessitem el teu cognom."
  },
  label: { es: "Tu apellido", ca: "El teu cognom" },
  action: { es: "Desbloquear", ca: "Desbloquejar" },
  error: {
    es: "Ese apellido no coincide con el de esta invitación. Si crees que es un error, escríbenos y lo cambiamos nosotros.",
    ca: "Aquest cognom no coincideix amb el d'aquesta invitació. Si creus que és un error, escriu-nos i ho canviem nosaltres."
  }
} as const;

/**
 * El enlace personal es la única credencial del invitado y viaja por WhatsApp,
 * donde se reenvía con facilidad. Confirmar por primera vez sigue sin fricción;
 * MODIFICAR una respuesta ya enviada pide el apellido, para que un reenvío no
 * acabe cambiando el menú de otra persona.
 */
export function RsvpEditGate({
  token,
  locale,
  action
}: {
  token: string;
  locale: WeddingLocale;
  action: (formData: FormData) => Promise<{ ok: boolean } | void>;
}) {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(false);
    try {
      const result = await action(formData);
      if (result && !result.ok) setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-4">
      <input name="token" type="hidden" value={token} />
      <input name="lang" type="hidden" value={locale} />
      <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
        <Lock className="mt-1 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">{T.title[locale]}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{T.copy[locale]}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apellidos">{T.label[locale]}</Label>
        <Input id="apellidos" name="apellidos" required autoComplete="family-name" />
      </div>

      {error ? (
        <p
          className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-foreground"
          role="alert"
        >
          <TriangleAlert className="mt-1 size-4 shrink-0 text-destructive" />
          <span>{T.error[locale]}</span>
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {T.action[locale]}
      </Button>
    </form>
  );
}
