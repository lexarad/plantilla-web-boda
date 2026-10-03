import { describe, expect, it } from "vitest";
import { budgetSchema, guestSchema, timelineEventSchema } from "./schemas";

const base = {
  nombre: "Ana",
  apellidos: "López",
  email: "",
  telefono: "",
  grupo: "",
  confirmacion_asistencia: "pendiente",
  menu_elegido: "pendiente",
  alergias_intolerancias: "",
  hotel_alojamiento: "",
  mesa_id: "",
  notas_internas: ""
};

describe("guestSchema.necesita_autobus (checkbox)", () => {
  it("acepta el 'on' de los formularios HTML", () => {
    const r = guestSchema.parse({ ...base, necesita_autobus: "on" });
    expect(r.necesita_autobus).toBe(true);
  });

  it("acepta un boolean true ya convertido (import CSV)", () => {
    // Regresión: antes un boolean true se convertía en false y la importación
    // de CSV perdía la logística de autobuses.
    const r = guestSchema.parse({ ...base, necesita_autobus: true });
    expect(r.necesita_autobus).toBe(true);
  });

  it("un boolean false sigue siendo false", () => {
    const r = guestSchema.parse({ ...base, necesita_autobus: false });
    expect(r.necesita_autobus).toBe(false);
  });

  it("un checkbox no marcado (undefined) es false", () => {
    const r = guestSchema.parse({ ...base, necesita_autobus: undefined });
    expect(r.necesita_autobus).toBe(false);
  });
});

describe("budgetSchema costes (money)", () => {
  const budgetBase = {
    categoria: "Catering",
    concepto: "Menú adultos",
    proveedor: "",
    estado_pago: "pendiente",
    fecha_pago: "",
    notas: ""
  };

  it("acepta punto decimal", () => {
    const r = budgetSchema.parse({ ...budgetBase, coste_estimado: "1234.56", coste_real: "0" });
    expect(r.coste_estimado).toBe(1234.56);
  });

  it("acepta coma decimal española", () => {
    // Regresión: Number("50,5") es NaN y el formulario rechazaba el importe.
    const r = budgetSchema.parse({ ...budgetBase, coste_estimado: "50,5", coste_real: "0" });
    expect(r.coste_estimado).toBe(50.5);
  });

  it("acepta formato español completo con miles y símbolo €", () => {
    const r = budgetSchema.parse({ ...budgetBase, coste_estimado: "1.234,56 €", coste_real: "0" });
    expect(r.coste_estimado).toBe(1234.56);
  });

  it("vacío se convierte en 0", () => {
    const r = budgetSchema.parse({ ...budgetBase, coste_estimado: "", coste_real: "" });
    expect(r.coste_estimado).toBe(0);
    expect(r.coste_real).toBe(0);
  });

  it("rechaza importes negativos", () => {
    expect(() =>
      budgetSchema.parse({ ...budgetBase, coste_estimado: "-10", coste_real: "0" })
    ).toThrow();
  });

  it("rechaza texto no numérico", () => {
    expect(() =>
      budgetSchema.parse({ ...budgetBase, coste_estimado: "abc", coste_real: "0" })
    ).toThrow();
  });
});

describe("timelineEventSchema (cronograma bilingüe)", () => {
  const base = { hora: "15:30", titulo: "Vals nupcial", descripcion: "Primer baile" };

  it("acepta las variantes en catalán", () => {
    const r = timelineEventSchema.parse({
      ...base,
      titulo_ca: "Vals nupcial",
      descripcion_ca: "Primer ball"
    });
    expect(r.titulo_ca).toBe("Vals nupcial");
    expect(r.descripcion_ca).toBe("Primer ball");
  });

  it("los campos en catalán son opcionales: vacío o ausente → null", () => {
    const r = timelineEventSchema.parse({ ...base, titulo_ca: "", descripcion_ca: "  " });
    expect(r.titulo_ca).toBeNull();
    expect(r.descripcion_ca).toBeNull();

    const r2 = timelineEventSchema.parse(base);
    expect(r2.titulo_ca).toBeNull();
    expect(r2.descripcion_ca).toBeNull();
  });

  it("sigue exigiendo hora en formato HH:MM y título", () => {
    expect(() => timelineEventSchema.parse({ ...base, hora: "9:5" })).toThrow();
    expect(() => timelineEventSchema.parse({ ...base, titulo: "" })).toThrow();
  });
});
