import { describe, expect, it } from "vitest";
import { normalizeInvitationCode, formatInvitationCode, generateInvitationCode } from "./invitation-code";

describe("normalizeInvitationCode", () => {
  it("quita espacios y guiones y pasa a mayúsculas", () => {
    expect(normalizeInvitationCode(" k7n-4q ")).toBe("K7N4Q");
    expect(normalizeInvitationCode("abc-de")).toBe("ABCDE");
  });
});

describe("formatInvitationCode", () => {
  it("inserta un guion tras los 3 primeros caracteres", () => {
    expect(formatInvitationCode("K7N4Q")).toBe("K7N-4Q");
  });

  it("no formatea códigos de 3 o menos", () => {
    expect(formatInvitationCode("AB")).toBe("AB");
    expect(formatInvitationCode("ABC")).toBe("ABC");
  });
});

describe("generateInvitationCode", () => {
  it("genera un código de 8 caracteres del alfabeto sin ambiguos (sin I,O,0,1)", () => {
    const code = generateInvitationCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    expect(code).not.toMatch(/[IO01]/);
  });

  it("evita colisiones con los códigos existentes", () => {
    // Forzamos que todos menos uno estén usados no es práctico; comprobamos que
    // no devuelve uno ya presente en un set pequeño repetidas veces.
    const existing = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const code = generateInvitationCode(existing);
      expect(existing.has(code)).toBe(false);
      existing.add(code);
    }
  });
});
