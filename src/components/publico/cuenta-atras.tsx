"use client";

import { useEffect, useState } from "react";
import type { WeddingLocale } from "@/config/boda";
import { textosWeb } from "@/lib/textos-web";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * "Faltan N días". Se calcula en el navegador: la página es estática y una
 * cifra pintada en el servidor quedaría congelada el día del despliegue.
 */
export function CuentaAtras({ fechaIso, locale }: { fechaIso: string; locale: WeddingLocale }) {
  const [dias, setDias] = useState<number | null>(null);

  useEffect(() => {
    setDias(Math.ceil((new Date(fechaIso).getTime() - Date.now()) / DIA_MS));
  }, [fechaIso]);

  if (dias === null || dias < 0) {
    return null;
  }

  const t = textosWeb[locale].inicio;

  return (
    <p className="text-sm font-medium text-primary" aria-live="polite">
      {dias === 0 ? t.hoy : t.faltan(dias)}
    </p>
  );
}
