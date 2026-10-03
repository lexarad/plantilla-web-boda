import type { Metadata } from "next";
import { CopyIbanButton } from "@/components/copy-iban-button";
import { ListaDatos, Pagina } from "@/components/publico/pagina";
import { getWeddingSettings } from "@/lib/data";
import { resolveLocale } from "@/lib/locale";
import { textosWeb } from "@/lib/textos-web";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  return { title: textosWeb[locale].regalo.titulo };
}

/** El IBAN de ejemplo (todo ceros) no se enseña como si fuera real. */
function esIbanDeEjemplo(iban: string) {
  return iban.replace(/[\s0]/g, "").toUpperCase() === "ES" || iban.trim() === "";
}

export default async function RegaloPage({ params }: { params: Promise<{ lang: string }> }) {
  const locale = resolveLocale((await params).lang);
  const t = textosWeb[locale].regalo;
  // IBAN, titular y concepto salen de las variables de entorno
  // NEXT_PUBLIC_WEDDING_IBAN* (o de Ajustes en modo demo).
  const settings = await getWeddingSettings();
  const sinIban = esIbanDeEjemplo(settings.iban);

  return (
    <Pagina titulo={t.titulo} intro={t.intro} locale={locale}>
      {sinIban ? (
        <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm">{t.sinIban}</p>
      ) : (
        <div className="space-y-4">
          <ListaDatos
            items={[
              { etiqueta: t.cuenta, valor: <span className="font-mono tracking-wide">{settings.iban}</span> },
              ...(settings.ibanHolder ? [{ etiqueta: t.titular, valor: settings.ibanHolder }] : []),
              ...(settings.ibanConcept ? [{ etiqueta: t.concepto, valor: settings.ibanConcept }] : [])
            ]}
          />
          <CopyIbanButton
            iban={settings.iban}
            label={t.copiar}
            copiedLabel={t.copiado}
            errorTitle={t.errorCopiar}
            errorDescription={t.errorCopiarDetalle}
          />
        </div>
      )}
    </Pagina>
  );
}
