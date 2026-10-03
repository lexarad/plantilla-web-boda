// Temas de color. Cada tema es un bloque [data-theme="..."] en
// src/styles/tokens.css que redefine las variables de color de la UI.
//   - "base":  web de invitados (neutro: cámbialo a tu gusto en tokens.css)
//   - "admin": panel privado
export type Theme = "base" | "admin";

export const PUBLIC_THEMES = ["base"] as const;
export type PublicTheme = (typeof PUBLIC_THEMES)[number];

export const DEFAULT_THEME: PublicTheme = "base";

export function isPublicTheme(value: unknown): value is PublicTheme {
  return typeof value === "string" && (PUBLIC_THEMES as readonly string[]).includes(value);
}
