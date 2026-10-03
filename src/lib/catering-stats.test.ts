import { describe, expect, it } from "vitest";
import { buildMenuStats } from "./catering-stats";
import type { CateringGuest } from "@/lib/types";

function cg(menu: string): CateringGuest {
  return { menu_elegido: menu } as CateringGuest;
}

describe("buildMenuStats", () => {
  it("cuenta los menús elegidos", () => {
    const stats = buildMenuStats([cg("adulto"), cg("adulto"), cg("vegano")]);
    const adulto = stats.find((s) => s.menu === "adulto");
    const vegano = stats.find((s) => s.menu === "vegano");
    expect(adulto?.count).toBe(2);
    expect(vegano?.count).toBe(1);
  });

  it("excluye 'pendiente' y los menús sin ninguna elección", () => {
    const stats = buildMenuStats([cg("adulto"), cg("pendiente"), cg("pendiente")]);
    expect(stats.every((s) => s.menu !== "pendiente")).toBe(true);
    expect(stats).toHaveLength(1);
    expect(stats[0].menu).toBe("adulto");
  });

  it("devuelve [] sin invitados", () => {
    expect(buildMenuStats([])).toEqual([]);
  });

  it("incluye la etiqueta legible de cada menú", () => {
    const stats = buildMenuStats([cg("vegetariano")]);
    expect(stats[0].label).toBeTruthy();
  });
});
