import { estadoProveedorLabel } from "@/lib/format";
import { isSupplierUnavailable } from "@/lib/supplier-status";
import type { Supplier, SupplierStatus } from "@/lib/types";

export type SupplierSortKey = "nombre" | "precio" | "estado";

export interface SupplierSearchParams {
  estado?: string | string[];
  tipo?: string | string[];
  orden?: string | string[];
  ocultar?: string | string[];
}

export const supplierStatusOptions: Array<[SupplierStatus, string]> = [
  ["idea", "Idea"],
  ["contactado", "Contactado"],
  ["cotizado", "Cotizado"],
  ["reservado", "Reservado"],
  ["pagado", "Pagado"]
];

// Fuente única de las etiquetas: src/lib/format.ts (estadoProveedorLabel), reutilizada
// también en la ficha de detalle del proveedor.
export const supplierStatusLabels: Record<SupplierStatus, string> = {
  idea: estadoProveedorLabel("idea"),
  contactado: estadoProveedorLabel("contactado"),
  cotizado: estadoProveedorLabel("cotizado"),
  reservado: estadoProveedorLabel("reservado"),
  pagado: estadoProveedorLabel("pagado")
};

export const statusStepIndex: Record<SupplierStatus, number> = {
  idea: 0,
  contactado: 1,
  cotizado: 2,
  reservado: 3,
  pagado: 4
};

export const supplierSortOptions: Array<[SupplierSortKey, string]> = [
  ["nombre", "Nombre (A-Z)"],
  ["precio", "Precio (menor primero)"],
  ["estado", "Estado (por avance)"]
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isSortKey(value: string): value is SupplierSortKey {
  return value === "nombre" || value === "precio" || value === "estado";
}

/** Valores ya normalizados de los filtros (para rellenar el formulario GET). */
export function readSupplierFilters(params: SupplierSearchParams) {
  const ordenRaw = firstParam(params.orden);
  return {
    estado: firstParam(params.estado) || "todos",
    tipo: firstParam(params.tipo) || "todos",
    orden: (isSortKey(ordenRaw) ? ordenRaw : "nombre") as SupplierSortKey,
    ocultar: firstParam(params.ocultar) === "1"
  };
}

export function getSupplierTypes(suppliers: Supplier[]) {
  return Array.from(new Set(suppliers.map((supplier) => supplier.tipo).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export function filterAndSortSuppliers(suppliers: Supplier[], params: SupplierSearchParams) {
  const { estado, tipo, orden, ocultar } = readSupplierFilters(params);

  const filtered = suppliers.filter((supplier) => {
    if (estado !== "todos" && supplier.estado !== estado) {
      return false;
    }

    if (tipo !== "todos" && supplier.tipo !== tipo) {
      return false;
    }

    if (ocultar && isSupplierUnavailable(supplier.notas)) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (orden === "precio") {
      // «Sin precio aún» (0 o menos) cae al FINAL, no al principio como si fuera el más barato.
      const precioA = a.precio > 0 ? a.precio : Infinity;
      const precioB = b.precio > 0 ? b.precio : Infinity;
      return precioA - precioB;
    }

    if (orden === "estado") {
      return statusStepIndex[a.estado] - statusStepIndex[b.estado];
    }

    return a.nombre.localeCompare(b.nombre, "es");
  });

  return sorted;
}
