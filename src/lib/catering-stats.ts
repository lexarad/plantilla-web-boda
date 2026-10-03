import { menuChoiceOptions } from "@/lib/rsvp-options";
import type { CateringGuest, MenuStat } from "@/lib/types";

/**
 * Acepta la lista de comensales o el recuento ya hecho por la base de datos
 * (`metricas_dashboard.menus`): el panel ya no necesita descargar la lista
 * entera solo para contar menús.
 */
export function buildMenuStats(source: CateringGuest[] | Record<string, number>): MenuStat[] {
  const counts = new Map<string, number>();

  if (Array.isArray(source)) {
    for (const guest of source) {
      counts.set(guest.menu_elegido, (counts.get(guest.menu_elegido) ?? 0) + 1);
    }
  } else {
    for (const [menu, total] of Object.entries(source)) {
      counts.set(menu, total);
    }
  }

  return menuChoiceOptions
    .filter((option) => option.value !== "pendiente" && counts.has(option.value))
    .map((option) => ({
      menu: option.value,
      label: option.label,
      count: counts.get(option.value) ?? 0
    }));
}
