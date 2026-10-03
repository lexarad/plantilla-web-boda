import { describe, it, expect } from "vitest";
import { validateStep, resolveStepIdx, type WizardState } from "./rsvp-validation";

const base: WizardState = {
  attendance: "confirmado",
  menu: "adulto",
  hasAllergies: false,
  allergies: "",
  bus: false,
  hotel: "",
  comments: "",
  song: ""
};

describe("validateStep — paso 0 (asistencia)", () => {
  it("confirmado pasa", () => {
    const r = validateStep(0, { ...base, attendance: "confirmado" });
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rechazado pasa", () => {
    const r = validateStep(0, { ...base, attendance: "rechazado" });
    expect(r.ok).toBe(true);
  });

  it("valor inválido falla con error en campo attendance", () => {
    // Forzamos el tipo para simular un estado corrupto
    const corrupted = { ...base, attendance: "pendiente" as "confirmado" | "rechazado" };
    const r = validateStep(0, corrupted);
    expect(r.ok).toBe(false);
    expect(r.errors[0].field).toBe("attendance");
    expect(r.errors[0].message).toBeTruthy();
  });
});

describe("validateStep — paso 1 (menú)", () => {
  it("menu válido pasa", () => {
    const r = validateStep(1, { ...base, menu: "vegetariano" });
    expect(r.ok).toBe(true);
  });

  it("todos los valores de menú válidos pasan", () => {
    const valores = ["adulto", "vegetariano", "vegano", "sin_gluten", "sin_lactosa", "infantil", "especial"];
    for (const v of valores) {
      const r = validateStep(1, { ...base, menu: v });
      expect(r.ok).toBe(true);
    }
  });

  it("menu vacío falla", () => {
    const r = validateStep(1, { ...base, menu: "" });
    expect(r.ok).toBe(false);
    expect(r.errors[0].field).toBe("menu");
  });

  it("menu desconocido falla", () => {
    const r = validateStep(1, { ...base, menu: "chuletón_especial" });
    expect(r.ok).toBe(false);
  });

  it("si attendance=rechazado el paso 1 siempre pasa aunque menú esté vacío", () => {
    const r = validateStep(1, { ...base, attendance: "rechazado", menu: "" });
    expect(r.ok).toBe(true);
  });
});

describe("validateStep — paso 2 (alergias)", () => {
  it("sin alergias siempre pasa", () => {
    const r = validateStep(2, { ...base, hasAllergies: false, allergies: "" });
    expect(r.ok).toBe(true);
  });

  it("hasAllergies=true con texto pasa", () => {
    const r = validateStep(2, { ...base, hasAllergies: true, allergies: "frutos secos" });
    expect(r.ok).toBe(true);
  });

  it("hasAllergies=true sin texto falla", () => {
    const r = validateStep(2, { ...base, hasAllergies: true, allergies: "" });
    expect(r.ok).toBe(false);
    expect(r.errors[0].field).toBe("allergies");
  });

  it("hasAllergies=true con solo espacios falla", () => {
    const r = validateStep(2, { ...base, hasAllergies: true, allergies: "   " });
    expect(r.ok).toBe(false);
  });
});

describe("validateStep — paso 3 (logística)", () => {
  it("siempre pasa independientemente del estado", () => {
    const r = validateStep(3, { ...base, bus: false, hotel: "" });
    expect(r.ok).toBe(true);
  });
});

describe("validateStep — paso 4 (revisión)", () => {
  it("siempre pasa", () => {
    const r = validateStep(4, base);
    expect(r.ok).toBe(true);
  });
});

describe("resolveStepIdx", () => {
  it("resuelve correctamente en modo confirmado (5 pasos)", () => {
    const steps = [0, 1, 2, 3, 4];
    expect(resolveStepIdx(steps, 0)).toBe(0);
    expect(resolveStepIdx(steps, 2)).toBe(2);
    expect(resolveStepIdx(steps, 4)).toBe(4);
  });

  it("resuelve correctamente en modo rechazado (2 pasos)", () => {
    const steps = [0, 4];
    expect(resolveStepIdx(steps, 0)).toBe(0);
    expect(resolveStepIdx(steps, 1)).toBe(4);
  });
});
