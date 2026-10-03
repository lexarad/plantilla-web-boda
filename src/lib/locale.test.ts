import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, WEDDING_LOCALES, isWeddingLocale, resolveLocale } from "./locale";

// Los idiomas publicados salen de src/config/boda.ts; las pruebas valen con uno o con varios.
const otro = WEDDING_LOCALES.find((locale) => locale !== DEFAULT_LOCALE);

describe("isWeddingLocale", () => {
  it("acepta los idiomas publicados", () => {
    for (const locale of WEDDING_LOCALES) {
      expect(isWeddingLocale(locale)).toBe(true);
    }
  });

  it("rechaza otros valores", () => {
    expect(isWeddingLocale("en")).toBe(false);
    expect(isWeddingLocale("")).toBe(false);
    expect(isWeddingLocale(undefined)).toBe(false);
  });
});

describe("resolveLocale (param > cookie > idioma principal)", () => {
  it("sin parámetro ni cookie, el idioma principal", () => {
    expect(resolveLocale(undefined, undefined)).toBe(DEFAULT_LOCALE);
  });

  it("ignora mayúsculas", () => {
    expect(resolveLocale(DEFAULT_LOCALE.toUpperCase(), undefined)).toBe(DEFAULT_LOCALE);
  });

  it("valores inválidos caen al idioma principal", () => {
    expect(resolveLocale("en", "fr")).toBe(DEFAULT_LOCALE);
  });

  it.runIf(Boolean(otro))("el parámetro de la URL manda sobre la cookie", () => {
    expect(resolveLocale(otro, DEFAULT_LOCALE)).toBe(otro);
    expect(resolveLocale(DEFAULT_LOCALE, otro)).toBe(DEFAULT_LOCALE);
  });

  it.runIf(Boolean(otro))("sin parámetro, cae a la cookie", () => {
    expect(resolveLocale(undefined, otro)).toBe(otro);
    expect(resolveLocale("en", otro)).toBe(otro);
  });
});
