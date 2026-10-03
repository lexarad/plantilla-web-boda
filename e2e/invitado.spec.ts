import { expect, test } from "@playwright/test";
import { nombresPareja } from "../src/config/boda";

// El camino que recorren los invitados, contra el modo demo (sin Supabase).
// La invitada de ejemplo K7N4Q (Laura Garcia) ya ha respondido, así que para
// cambiar su respuesta hay que confirmar el apellido.

const CODIGO_DEMO = "K7N4Q";
const APELLIDO_DEMO = "Garcia";

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("la portada carga y ofrece confirmar asistencia", async ({ page }) => {
  await page.goto("/es");

  await expect(page).toHaveTitle(new RegExp(escapar(nombresPareja)));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(nombresPareja);
  await expect(page.getByRole("link", { name: /confirmar asistencia/i }).first()).toBeVisible();
});

test("la portada respeta el catalán", async ({ page }) => {
  await page.goto("/ca");

  await expect(page.locator("html")).toHaveAttribute("lang", "ca");
  await expect(page.getByRole("link", { name: /confirmar assistència/i }).first()).toBeVisible();
});

test("las direcciones sin idioma redirigen", async ({ page }) => {
  await page.goto("/agenda");

  await expect(page).toHaveURL(/\/es\/agenda$/);
});

test("un enlace de invitación inválido no rompe la página", async ({ page }) => {
  await page.goto("/es/rsvp/enlace-que-no-existe");

  await expect(page.getByRole("heading", { name: /no encontramos/i })).toBeVisible();
  // Nunca debe aparecer una traza técnica ante el invitado.
  await expect(page.locator("body")).not.toContainText(/Application error|fetch failed|Unhandled/i);
});

test("sin Supabase en producción, los códigos de ejemplo no se aceptan", async ({ page }) => {
  // Las pruebas corren contra un build de producción sin base de datos: ahí
  // la web aún no está lista para invitados reales y lo dice, en vez de
  // dejar entrar con los códigos de la demo.
  await page.goto("/es/rsvp");
  await page.getByLabel(/código de invitación/i).fill(CODIGO_DEMO.toLowerCase());
  await page.getByRole("button", { name: /continuar/i }).click();

  await expect(page).toHaveURL(/\/es\?estado=en-preparacion$/);
  await expect(page.getByRole("status")).toContainText(/en preparación/i);
});

test("el invitado puede cambiar su respuesta", async ({ page }) => {
  await page.goto(`/es/rsvp/${CODIGO_DEMO}`);

  const apellido = page.getByLabel(/tu apellido/i);
  if (await apellido.isVisible().catch(() => false)) {
    await apellido.fill(APELLIDO_DEMO);
    await page.getByRole("button", { name: /desbloquear/i }).click();
  }

  await page.getByLabel(/sí, allí estaré/i).check();
  await page.getByLabel(/alergias/i).fill("Ninguna");
  await page.getByRole("button", { name: /enviar respuesta/i }).click();

  await expect(page.getByRole("status").filter({ hasText: /hemos guardado tu respuesta/i })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Application error|fetch failed/i);
});

test("las páginas públicas responden y no filtran errores", async ({ page }) => {
  for (const ruta of ["/es/agenda", "/es/informacion", "/es/mapa", "/es/regalo", "/es/rsvp", "/ca/agenda"]) {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status(), `${ruta} debería responder 200`).toBe(200);
    await expect(page.locator("body")).not.toContainText(/Application error|fetch failed/i);
  }
});
