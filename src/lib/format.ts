import type { AuditAction, RsvpStatus, SupplierStatus } from "@/lib/types";

export const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

/** Fecha + hora corta (día/mes hora:min). Devuelve null si no hay valor. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Precio de proveedor: importe formateado, o «Sin precio aún» cuando aún no hay (0). */
export function formatPrecioProveedor(precio: number) {
  return precio > 0 ? formatCurrency(precio) : "Sin precio aún";
}

export function rsvpLabel(value: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    rechazado: "No asiste"
  };

  return labels[value] ?? value;
}

export function paymentLabel(value: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    parcial: "Parcial",
    pagado: "Pagado"
  };

  return labels[value] ?? value;
}

/** Variante de Badge para el estado RSVP de un invitado (confirmado/rechazado/pendiente). */
export function rsvpBadgeVariant(estado: RsvpStatus): "success" | "warning" | "danger" {
  if (estado === "confirmado") {
    return "success";
  }

  if (estado === "rechazado") {
    return "danger";
  }

  return "warning";
}

const supplierStatusLabelMap: Record<SupplierStatus, string> = {
  idea: "Idea",
  contactado: "Contactado",
  cotizado: "Cotizado",
  reservado: "Reservado",
  pagado: "Pagado"
};

/** Etiqueta capitalizada del estado administrativo de un proveedor (idea/contactado/…). */
export function estadoProveedorLabel(value: SupplierStatus | string): string {
  return supplierStatusLabelMap[value as SupplierStatus] ?? value;
}

const auditActionLabelMap: Record<AuditAction, string> = {
  created: "Creado",
  updated: "Actualizado",
  moved: "Movido",
  deleted: "Eliminado"
};

/** Etiqueta en castellano de una acción de auditoría; capitaliza como fallback si no está mapeada. */
export function auditActionLabel(action: AuditAction | string): string {
  const known = auditActionLabelMap[action as AuditAction];
  if (known) {
    return known;
  }

  return action.charAt(0).toUpperCase() + action.slice(1);
}

const localeLabelMap: Record<string, string> = {
  es: "Español",
  ca: "Català"
};

/** Etiqueta legible del idioma del último RSVP; «Sin dato» si falta o no está mapeado. */
export function localeLabel(value: string | null | undefined): string {
  if (!value) {
    return "Sin dato";
  }

  return localeLabelMap[value] ?? "Sin dato";
}

export function formatBytes(value: number | null | undefined) {
  const bytes = value ?? 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes < 10 ? 1 : 0)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes < 10 ? 1 : 0)} MB`;
}

/**
 * Concordancia de número para los recuentos visibles («1 mesa» / «3 mesas»).
 * pluralForm solo hace falta cuando no basta con añadir «s».
 */
export function plural(n: number, singular: string, pluralForm?: string): string {
  return n === 1 ? singular : (pluralForm ?? `${singular}s`);
}
