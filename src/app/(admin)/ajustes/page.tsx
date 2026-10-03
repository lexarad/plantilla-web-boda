import Link from "next/link";
import { CreditCard, Hotel, Mail, Phone, Save, Settings as SettingsIcon } from "lucide-react";
import { updateSettingsAction } from "@/app/(admin)/ajustes/actions";
import { getWeddingSettings } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const settings = await getWeddingSettings();
  const demo = isDemoMode();

  return (
    <>
      <AdminPageHeader
        eyebrow="Ajustes"
        title="Datos de la boda"
        description="IBAN, contacto y otros datos que aparecen en las páginas públicas."
      />

      {!demo ? (
        <Card className="mb-6 border-info/30 bg-info/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <span className="text-xl">ℹ️</span>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Estos datos se guardan en la web ya publicada</p>
              <p className="text-foreground/80">
                Si necesitas cambiar el IBAN, el teléfono, el correo o las sugerencias de alojamiento, díselo a
                quien te ayuda con la web y lo dejará listo en un momento.
              </p>
              <details className="text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground/70">Detalles para quien lleva la web</summary>
                <p className="mt-2">
                  Estos valores se leen de variables de entorno en el despliegue:{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_IBAN</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_IBAN_HOLDER</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_IBAN_CONCEPT</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_PHONE</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_EMAIL</code>,{" "}
                  <code className="rounded bg-muted px-1 font-mono text-[11px]">NEXT_PUBLIC_WEDDING_HOTELS</code>. El
                  formulario de abajo solo tiene efecto en la versión de pruebas.
                </p>
              </details>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* En produccion estos valores vienen de la configuracion del despliegue: el
          formulario se muestra deshabilitado para que no exista un "Guardar" que mienta. */}
      <form action={updateSettingsAction} className="max-w-3xl">
        <fieldset disabled={!demo} className="grid gap-4 disabled:opacity-80">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Datos bancarios para regalos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Aparecen en <Link className="text-primary underline" href="/regalo">/regalo</Link>. Si dejas el IBAN
              de ejemplo, la página lo mostrará con un aviso de que aún no es el definitivo.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                name="iban"
                defaultValue={settings.iban}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Con o sin espacios — al copiar se quitan automáticamente.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ibanHolder">Titular</Label>
                <Input
                  id="ibanHolder"
                  name="ibanHolder"
                  defaultValue={settings.ibanHolder}
                  placeholder="Nombre y apellidos del titular"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ibanConcept">Concepto sugerido</Label>
                <Input
                  id="ibanConcept"
                  name="ibanConcept"
                  defaultValue={settings.ibanConcept}
                  placeholder="Boda + tu nombre"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-4 text-primary" />
              Contacto público
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Datos opcionales para enlaces de WhatsApp/correo en la página de información.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">
                <Phone className="mr-1 inline size-3" />
                Teléfono / WhatsApp
              </Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                defaultValue={settings.contactPhone}
                placeholder="+34 600 000 000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">
                <Mail className="mr-1 inline size-3" />
                Correo
              </Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
                placeholder="boda@ejemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="size-4 text-primary" />
              Sugerencias de alojamiento
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Texto libre que aparece en /información para guiar a invitados de fuera.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              id="hotelSuggestions"
              name="hotelSuggestions"
              defaultValue={settings.hotelSuggestions}
              rows={4}
              placeholder={"Hotel Ejemplo (3 km) · habitaciones reservadas hasta el 1 de julio\nCasa rural (5 km)\n..."}
            />
          </CardContent>
        </Card>

        {demo ? (
          <div className="flex justify-end">
            <SubmitButton className="h-11 px-5 shadow-panel" pendingText="Guardando…">
              <Save className="size-4" />
              Guardar cambios
            </SubmitButton>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Estos datos se cambian junto con la publicación de la web. Si necesitáis tocar algo
            (IBAN, teléfono, hoteles…), pedídselo a Claude y lo deja listo.
          </p>
        )}
        </fieldset>
      </form>

      <Card className="mt-8 max-w-3xl bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="size-4 text-primary" />
            ¿Dónde se ven estos datos?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>IBAN, titular y concepto</strong> → página pública <Link className="text-primary underline" href="/regalo">/regalo</Link>.
          </p>
          <p>
            <strong>Teléfono y correo</strong> → bloques de contacto en <Link className="text-primary underline" href="/informacion">/información</Link>.
          </p>
          <p>
            <strong>Sugerencias de alojamiento</strong> → bloque de hoteles en <Link className="text-primary underline" href="/informacion">/información</Link>.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
