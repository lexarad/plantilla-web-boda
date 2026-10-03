import { describe, expect, it } from "vitest";
import { isWeddingLocale, resolveLocale } from "./locale";

describe("isWeddingLocale", () => {
  it("acepta es y ca", () => {
    expect(isWeddingLocale("es")).toBe(true);
    expect(isWeddingLocale("ca")).toBe(true);
  });

  it("rechaza otros valores", () => {
    expect(isWeddingLocale("en")).toBe(false);
    expect(isWeddingLocale("")).toBe(false);
    expect(isWeddingLocale(undefined)).toBe(false);
  });
});

describe("resolveLocale (param > cookie > es)", () => {
  it("el parámetro de la URL manda", () => {
    expect(resolveLocale("ca", "es")).toBe("ca");
    expect(resolveLocale("ES", "ca")).toBe("es");
  });

  it("sin parámetro, cae a la cookie", () => {
    expect(resolveLocale(undefined, "ca")).toBe("ca");
    expect(resolveLocale(null, "CA")).toBe("ca");
  });

  it("sin parámetro ni cookie, castellano", () => {
    expect(resolveLocale(undefined, undefined)).toBe("es");
  });

  it("valores inválidos no rompen la cadena", () => {
    expect(resolveLocale("en", "ca")).toBe("ca");
    expect(resolveLocale("en", "fr")).toBe("es");
  });
});
