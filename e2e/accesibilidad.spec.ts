import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// La accesibilidad estaba cuidada a ojo pero nunca medida. Entre los invitados
// hay gente mayor leyendo desde el móvil con la letra grande: lo que no se
// mide, se degrada con cada cambio.
const PAGINAS = [
  ["portada", "/es"],
  ["agenda", "/es/agenda"],
  ["información", "/es/informacion"],
  ["regalo", "/es/regalo"],
  ["invitación", "/es/rsvp/K7N4Q"],
  ["acceso", "/login"]
] as const;

// Con las animaciones de aparición en marcha, axe mide colores a medio
// desvanecer y da falsos positivos de contraste. Se piden sin movimiento
// (la web ya respeta prefers-reduced-motion) y se espera a que todo asiente.
test.use({ contextOptions: { reducedMotion: "reduce" } });

for (const [nombre, ruta] of PAGINAS) {
  test(`sin fallos graves de accesibilidad: ${nombre}`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const graves = violations.filter((v) => v.impact === "critical" || v.impact === "serious");

    // Mensaje útil cuando falla: qué regla y en qué elemento.
    const detalle = graves
      .map((v) => `${v.id} (${v.impact}) → ${v.nodes[0]?.target.join(" ")}`)
      .join("\n");

    expect(graves, `Fallos graves en ${nombre}:\n${detalle}`).toHaveLength(0);
  });
}
