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
    description: "Tu invitación lleva un código de letras y números (o un QR que te trae aquí directamente).",
    label: "Código de invitación",
    placeholder: "Por ejemplo: AB12CD34",
    button: "Continuar",
    helper: "Sin registros ni contraseñas: solo el código.",
    invalid: "Ese código no existe. Comprueba las letras y los números e inténtalo de nuevo."
  },
  ca: {
    title: "Confirmar assistència",
    description: "La teva invitació porta un codi de lletres i números (o un QR que et porta aquí directament).",
    label: "Codi d'invitació",
    placeholder: "Per exemple: AB12CD34",
    button: "Continuar",
    helper: "Sense registres ni contrasenyes: només el codi.",
    invalid: "Aquest codi no existeix. Comprova les lletres i els números i torna-ho a provar."
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
