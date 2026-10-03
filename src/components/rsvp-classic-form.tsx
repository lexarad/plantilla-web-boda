"use client";

import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { getRsvpErrorMessage, type RsvpActionResult } from "@/lib/rsvp-errors";
import type { WeddingLocale } from "@/lib/wedding-details";

/**
 * Formulario clásico del RSVP (el que no usa el asistente por pasos).
 * Antes iba directo a la server action: cualquier fallo levantaba la pantalla
 * de error de Next.js y el invitado perdía alergias, comentarios y canción.
 * Aquí el fallo se queda dentro del formulario, con los campos intactos.
 */
export function RsvpClassicForm({
  action,
  locale,
  children
}: {
  action: (formData: FormData) => Promise<RsvpActionResult | void>;
  locale: WeddingLocale;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      const result = await action(formData);
      if (result && !result.ok) {
        setError(getRsvpErrorMessage(result.code, locale));
      }
    } catch {
      // Fallo de red antes siquiera de llegar al servidor.
      setError(getRsvpErrorMessage("red", locale));
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-5">
      {error ? (
        <p
          className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-foreground"
          role="alert"
        >
          <TriangleAlert className="mt-1 size-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </p>
      ) : null}
      {children}
    </form>
  );
}
