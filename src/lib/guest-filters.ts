import type { Guest } from "@/lib/types";
import { normalizeText } from "@/lib/text";

export interface GuestSearchParams {
  q?: string | string[];
  estado?: string | string[];
  mesa?: string | string[];
}

export function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export function matchesGuestSearch(guest: Guest, query: string) {
  if (!query) {
    return true;
  }

  // El texto donde se busca TAMBI\u00c9N debe normalizarse (sin acentos), no solo la
  // query; si no, "jose" nunca encontrar\u00eda "Jos\u00e9".
  const haystack = normalizeText(
    [
      guest.nombre,
      guest.apellidos,
      guest.email,
      guest.telefono,
      guest.grupo,
      guest.mesa_nombre,
      guest.codigo_invitacion,
      guest.notas_internas,
      guest.comentarios
    ]
      .filter(Boolean)
      .join(" ")
  );

  return haystack.includes(normalizeText(query));
}

export function filterGuests(guests: Guest[], params: GuestSearchParams) {
  const query = normalizeText(normalizeSearchParam(params.q));
  const statusFilter = normalizeSearchParam(params.estado);
  const tableFilter = normalizeSearchParam(params.mesa);

  return guests.filter((guest) => {
    if (statusFilter && statusFilter !== "todos" && guest.confirmacion_asistencia !== statusFilter) {
      return false;
    }

    if (tableFilter === "sin_mesa" && guest.mesa_id) {
      return false;
    }

    if (tableFilter && tableFilter !== "todos" && tableFilter !== "sin_mesa" && guest.mesa_id !== tableFilter) {
      return false;
    }

    return matchesGuestSearch(guest, query);
  });
}

export function buildGuestExportSearchParams(params: GuestSearchParams) {
  const searchParams = new URLSearchParams();
  const q = normalizeSearchParam(params.q).trim();
  const estado = normalizeSearchParam(params.estado);
  const mesa = normalizeSearchParam(params.mesa);

  if (q) {
    searchParams.set("q", q);
  }

  if (estado && estado !== "todos") {
    searchParams.set("estado", estado);
  }

  if (mesa && mesa !== "todos") {
    searchParams.set("mesa", mesa);
  }

  return searchParams;
}
