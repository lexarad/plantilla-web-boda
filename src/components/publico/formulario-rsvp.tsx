"use client";

import { useState } from "react";
import type { WeddingLocale } from "@/config/boda";
import { RsvpClassicForm } from "@/components/rsvp-classic-form";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RsvpActionResult } from "@/lib/rsvp-errors";

/** Valores que acepta la base de datos (no cambiarlos sin tocar el SQL). */
const MENUS = ["adulto", "vegetariano", "vegano", "sin_gluten", "sin_lactosa", "infantil", "especial"] as const;

const T = {
  es: {
    asistencia: "¿Vienes?",
    si: "Sí, allí estaré",
    no: "No podré ir",
    menu: "Menú",
    menus: {
      adulto: "Adulto",
      vegetariano: "Vegetariano",
      vegano: "Vegano",
      sin_gluten: "Sin gluten",
      sin_lactosa: "Sin lactosa",
      infantil: "Infantil",
      especial: "Especial (cuéntanos en comentarios)"
    },
    alergias: "Alergias o intolerancias",
    autobus: "Quiero plaza en el autobús",
    alojamiento: "¿Dónde te alojas? (opcional)",
    cancion: "Una canción que no puede faltar (opcional)",
    comentarios: "Comentarios",
    guardar: "Enviar respuesta",
    guardando: "Enviando…"
  },
  ca: {
    asistencia: "Vens?",
    si: "Sí, hi seré",
    no: "No podré venir",
    menu: "Menú",
    menus: {
      adulto: "Adult",
      vegetariano: "Vegetarià",
      vegano: "Vegà",
      sin_gluten: "Sense gluten",
      sin_lactosa: "Sense lactosa",
      infantil: "Infantil",
      especial: "Especial (explica-ho als comentaris)"
    },
    alergias: "Al·lèrgies o intoleràncies",
    autobus: "Vull plaça a l'autobús",
    alojamiento: "On t'allotges? (opcional)",
    cancion: "Una cançó que no pot faltar (opcional)",
    comentarios: "Comentaris",
    guardar: "Enviar resposta",
    guardando: "Enviant…"
  }
} as const;

export type ValoresRsvp = {
  confirmacion_asistencia: "pendiente" | "confirmado" | "rechazado";
  menu_elegido: string;
  alergias_intolerancias: string | null;
  necesita_autobus: boolean;
  hotel_alojamiento: string | null;
  comentarios: string | null;
  cancion_sugerida: string | null;
};

/**
 * Formulario de confirmación con controles nativos del navegador, fácil de
 * restilar. Si el invitado dice que no viene se esconden el resto de campos
 * (siguen enviándose con su valor, que es lo que espera la base de datos).
 */
export function FormularioRsvp({
  token,
  locale,
  inicial,
  mostrarAutobus,
  action
}: {
  token: string;
  locale: WeddingLocale;
  inicial: ValoresRsvp;
  mostrarAutobus: boolean;
  action: (formData: FormData) => Promise<RsvpActionResult | void>;
}) {
  const t = T[locale];
  const [asiste, setAsiste] = useState(inicial.confirmacion_asistencia !== "rechazado");
  const menuInicial = (MENUS as readonly string[]).includes(inicial.menu_elegido) ? inicial.menu_elegido : "adulto";

  return (
    <RsvpClassicForm action={action} locale={locale}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={locale} />

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t.asistencia}</legend>
        {(
          [
            ["confirmado", t.si],
            ["rechazado", t.no]
          ] as const
        ).map(([valor, etiqueta]) => (
          <label key={valor} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="confirmacion_asistencia"
              value={valor}
              defaultChecked={(valor === "confirmado") === asiste}
              onChange={() => setAsiste(valor === "confirmado")}
              className="accent-[hsl(var(--primary))]"
            />
            <span className="text-sm">{etiqueta}</span>
          </label>
        ))}
      </fieldset>

      <fieldset hidden={!asiste} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="menu_elegido">{t.menu}</Label>
          <select
            id="menu_elegido"
            name="menu_elegido"
            defaultValue={menuInicial}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {MENUS.map((menu) => (
              <option key={menu} value={menu}>
                {t.menus[menu]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="alergias_intolerancias">{t.alergias}</Label>
          <Textarea
            id="alergias_intolerancias"
            name="alergias_intolerancias"
            rows={2}
            defaultValue={inicial.alergias_intolerancias ?? ""}
          />
        </div>

        {mostrarAutobus ? (
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="necesita_autobus"
              defaultChecked={inicial.necesita_autobus}
              className="size-4 accent-[hsl(var(--primary))]"
            />
            {t.autobus}
          </label>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="hotel_alojamiento">{t.alojamiento}</Label>
          <Input id="hotel_alojamiento" name="hotel_alojamiento" defaultValue={inicial.hotel_alojamiento ?? ""} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cancion_sugerida">{t.cancion}</Label>
          <Input id="cancion_sugerida" name="cancion_sugerida" defaultValue={inicial.cancion_sugerida ?? ""} />
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="comentarios">{t.comentarios}</Label>
        <Textarea id="comentarios" name="comentarios" rows={3} defaultValue={inicial.comentarios ?? ""} />
      </div>

      <SubmitButton className="rounded-md" pendingText={t.guardando}>
        {t.guardar}
      </SubmitButton>
    </RsvpClassicForm>
  );
}
