import { describe, expect, it } from "vitest";
import { auditActionLabel, estadoProveedorLabel, formatPrecioProveedor, localeLabel, rsvpBadgeVariant } from "./format";
import { buildWhatsappUrl } from "./whatsapp";

describe("formatPrecioProveedor", () => {
  it("devuelve «Sin precio aún» cuando el precio es 0", () => {
    expect(formatPrecioProveedor(0)).toBe("Sin precio aún");
  });

  it("formatea como moneda cuando hay precio", () => {
    expect(formatPrecioProveedor(1500)).toBe(formatCurrencyRef(1500));
  });

  it("trata precios negativos como «Sin precio aún»", () => {
    expect(formatPrecioProveedor(-10)).toBe("Sin precio aún");
  });
});

describe("rsvpBadgeVariant", () => {
  it("devuelve success para confirmado", () => {
    expect(rsvpBadgeVariant("confirmado")).toBe("success");
  });

  it("devuelve danger para rechazado", () => {
    expect(rsvpBadgeVariant("rechazado")).toBe("danger");
  });

  it("devuelve warning para pendiente", () => {
    expect(rsvpBadgeVariant("pendiente")).toBe("warning");
  });
});

describe("estadoProveedorLabel", () => {
  it("capitaliza los estados conocidos", () => {
    expect(estadoProveedorLabel("idea")).toBe("Idea");
    expect(estadoProveedorLabel("contactado")).toBe("Contactado");
    expect(estadoProveedorLabel("cotizado")).toBe("Cotizado");
    expect(estadoProveedorLabel("reservado")).toBe("Reservado");
    expect(estadoProveedorLabel("pagado")).toBe("Pagado");
  });

  it("devuelve el valor crudo como fallback si no está mapeado", () => {
    expect(estadoProveedorLabel("desconocido")).toBe("desconocido");
  });
});

describe("auditActionLabel", () => {
  it("traduce las acciones conocidas al castellano", () => {
    expect(auditActionLabel("created")).toBe("Creado");
    expect(auditActionLabel("updated")).toBe("Actualizado");
    expect(auditActionLabel("moved")).toBe("Movido");
    expect(auditActionLabel("deleted")).toBe("Eliminado");
  });

  it("capitaliza como fallback si la acción no está mapeada", () => {
    expect(auditActionLabel("archived")).toBe("Archived");
  });
});

describe("localeLabel", () => {
  it("traduce los códigos de idioma conocidos", () => {
    expect(localeLabel("es")).toBe("Español");
    expect(localeLabel("ca")).toBe("Català");
  });

  it("devuelve «Sin dato» cuando falta el valor", () => {
    expect(localeLabel(null)).toBe("Sin dato");
    expect(localeLabel(undefined)).toBe("Sin dato");
    expect(localeLabel("")).toBe("Sin dato");
  });

  it("devuelve «Sin dato» como fallback si el código no está mapeado", () => {
    expect(localeLabel("fr")).toBe("Sin dato");
  });
});

describe("buildWhatsappUrl", () => {
  it("codifica el texto con encodeURIComponent", () => {
    expect(buildWhatsappUrl("Hola Ana, +info aquí")).toBe(
      `https://wa.me/?text=${encodeURIComponent("Hola Ana, +info aquí")}`
    );
  });

  it("codifica los espacios como %20", () => {
    expect(buildWhatsappUrl("hola mundo")).toBe("https://wa.me/?text=hola%20mundo");
  });
});

// Referencia local para no acoplar el test al formato exacto de la locale.
function formatCurrencyRef(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}
