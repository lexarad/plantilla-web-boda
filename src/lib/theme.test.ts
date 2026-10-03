import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, PUBLIC_THEMES, isPublicTheme } from "./theme";

describe("temas", () => {
  it("el tema por defecto es uno de los públicos", () => {
    expect(PUBLIC_THEMES).toContain(DEFAULT_THEME);
  });

  it("isPublicTheme distingue temas públicos del resto", () => {
    expect(isPublicTheme("base")).toBe(true);
    expect(isPublicTheme("admin")).toBe(false);
    expect(isPublicTheme(undefined)).toBe(false);
  });
});
