import type { Metadata } from "next";
import { openRsvpAccessAction } from "@/app/(public)/[lang]/rsvp/actions";
import { Pagina } from "@/components/publico/pagina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeddingLocale } from "@/config/boda";
import { resolveLocale } from "@/lib/locale";

const copy: Record<
  WeddingLocale,
  { title: string; description: string; label: string; placeholder: string; button: string; helper: string; invalid: string }
> = {
  es: {
    title: "Confirmar asistencia",
    description: "Escribe el código que aparece en tu invitación. Si tienes el QR, escanéalo y llegarás directamente.",
    label: "Código de invitación",
    placeholder: "Ejemplo: K7N4Q",
    button: "Continuar",
    helper: "No necesitas cuenta ni contraseña.",
    invalid: "No encontramos ese código. Revisa que esté bien escrito."
  },
  ca: {
    title: "Confirmar assistència",
    description: "Escriu el codi que apareix a la teva invitació. Si tens el QR, escaneja'l i hi arribaràs directament.",
    label: "Codi d'invitació",
    placeholder: "Exemple: K7N4Q",
    button: "Continuar",
    helper: "No necessites compte ni contrasenya.",
    invalid: "No trobem aquest codi. Revisa que estigui ben escrit."
  }
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return { title: copy[locale].title, description: copy[locale].description };
}

export default async function RsvpAccessPage({
  params,
  searchParams
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const locale = resolveLocale((await params).lang);
  const text = copy[locale];
  const invalid = query.error === "invalid";

  return (
    <Pagina titulo={text.title} intro={text.description} locale={locale}>
      <form action={openRsvpAccessAction} className="grid max-w-md gap-4">
        <input name="lang" type="hidden" value={locale} />
        {invalid ? (
          <p id="code-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            {text.invalid}
          </p>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="code">{text.label}</Label>
          <Input
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            className="font-mono text-lg uppercase tracking-widest"
            id="code"
            name="code"
            placeholder={text.placeholder}
            required
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? "code-error" : undefined}
          />
        </div>
        <Button type="submit" className="rounded-md">
          {text.button}
        </Button>
        <p className="text-sm text-muted-foreground">{text.helper}</p>
      </form>
    </Pagina>
  );
}
