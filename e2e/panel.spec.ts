import { expect, test } from "@playwright/test";

// Estas pruebas corren contra un BUILD DE PRODUCCIÓN sin Supabase, que es
// exactamente el escenario peligroso: si el modo demo se colara en producción,
// el panel privado quedaría abierto a cualquiera. Aquí se verifica que no.

const RUTAS_PRIVADAS = [
  "/dashboard",
  "/invitados",
  "/mesas",
  "/presupuesto",
  "/proveedores",
  "/documentos",
  "/catering",
  "/busqueda"
];

test("el panel privado nunca se abre sin Supabase configurado", async ({ page }) => {
  for (const ruta of RUTAS_PRIVADAS) {
    await page.goto(ruta);
    await expect(page, `${ruta} debería llevar al acceso`).toHaveURL(/\/login/);
  }
});

test("la página de acceso funciona y no filtra datos", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /acceso/i }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Application error|fetch failed/i);
  // Sin Supabase no debe ofrecer entrar: solo el aviso de configuración.
  await expect(page.locator("body")).not.toContainText(/modo demo/i);
});

test("el vigilante de la base de datos responde", async ({ request }) => {
  const respuesta = await request.get("/api/cron/keepalive");

  // 200 si todo va bien, 401 si está protegido con CRON_SECRET, 503 si no hay
  // Supabase configurado. Nunca una traza técnica ni un 500.
  expect([200, 401, 503]).toContain(respuesta.status());
  const cuerpo = await respuesta.json();
  expect(cuerpo).toHaveProperty("ok");
});
