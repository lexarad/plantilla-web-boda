import type { Guest, Supplier, WeddingDocument } from "@/lib/types";
import { normalizeText } from "@/lib/text";

export interface GlobalSearchParams {
  q?: string | string[];
  entidad?: string | string[];
}

export type GlobalSearchEntity = "all" | "invitados" | "proveedores" | "documentos";

export function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export function normalizeSearchEntityParam(value: string | string[] | undefined): GlobalSearchEntity {
  const normalized = normalizeSearchParam(value);

  if (normalized === "invitados" || normalized === "proveedores" || normalized === "documentos") {
    return normalized;
  }

  return "all";
}

function matchesSearch(fields: Array<string | null | undefined>, query: string) {
  if (!query) {
    return true;
  }

  // Normalizar tambi\u00e9n el haystack (sin acentos), no solo la query.
  const haystack = normalizeText(fields.filter(Boolean).join(" "));
  return haystack.includes(normalizeText(query));
}

export function filterGuestsForSearch(guests: Guest[], query: string) {
  return guests.filter((guest) =>
    matchesSearch(
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
      ],
      query
    )
  );
}

export function filterSuppliersForSearch(suppliers: Supplier[], query: string) {
  return suppliers.filter((supplier) =>
    matchesSearch([supplier.nombre, supplier.tipo, supplier.email, supplier.telefono, supplier.web, supplier.estado, supplier.notas], query)
  );
}

export function filterDocumentsForSearch(documents: WeddingDocument[], query: string) {
  return documents.filter((document) =>
    matchesSearch([document.nombre, document.archivo_nombre, document.tipo, document.mime_type, document.proveedor_nombre, document.notas], query)
  );
}
