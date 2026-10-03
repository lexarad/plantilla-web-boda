import { defineConfig, devices } from "@playwright/test";

// Pruebas del camino crítico: lo que hace un invitado y lo que hacen los
// organizadores. Se ejecutan contra el modo demo (sin Supabase), que es el
// único entorno reproducible sin tocar datos reales.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "on-first-retry"
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] } }
  ],
  webServer: {
    // Build de producción, no dev: `next dev` compila cada ruta la primera vez
    // que se pide y, con varios workers a la vez, devolvía 500 por timeout.
    // Además así se prueba lo que de verdad se despliega (páginas estáticas
    // incluidas). Modo demo: sin variables de Supabase se usa el store de ejemplo.
    command:
      "cross-env-shell NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= \"npx next build && npx next start -p 3210\"",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000
  }
});
