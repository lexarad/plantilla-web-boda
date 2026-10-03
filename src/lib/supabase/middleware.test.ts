import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./middleware";

describe("isProtectedPath", () => {
  const rutasPublicas = [
    "/",
    "/es",
    "/ca",
    "/es/rsvp",
    "/es/rsvp/ABCDE",
    "/es/agenda",
    "/es/informacion",
    "/es/mapa",
    "/es/regalo",
    "/login"
  ];

  const rutasProtegidas = [
    "/dashboard",
    "/invitados",
    "/invitados/123",
    "/invitados/123/qr",
    "/mesas",
    "/mesas/plano",
    "/catering",
    "/autobuses",
    "/proveedores",
    "/documentos",
    "/presupuesto",
    "/tareas",
    "/canciones",
    "/ajustes",
    "/grupos",
    "/cronograma",
    "/busqueda"
  ];

  it.each(rutasPublicas)("deja pasar la ruta pública %s", (ruta) => {
    expect(isProtectedPath(ruta)).toBe(false);
  });

  it.each(rutasProtegidas)("protege la ruta del panel %s", (ruta) => {
    expect(isProtectedPath(ruta)).toBe(true);
  });

  it.each(["/api/cron/keepalive", "/api"])("deja pasar la ruta de API %s", (ruta) => {
    // El cron diario que mantiene despierto Supabase se llama sin sesión: si
    // alguien protegiera /api, recibiría un redirect y la pausa volvería en
    // silencio (Vercel Hobby no avisa de crons fallidos).
    expect(isProtectedPath(ruta)).toBe(false);
  });

  it("no confunde prefijos parciales de páginas públicas con rutas protegidas", () => {
    // Regresión: ninguna página pública empieza por un prefijo del panel.
    // Si algún día se añade una pública con nombre cercano, este test avisa.
    expect(isProtectedPath("/mapa")).toBe(false);
    expect(isProtectedPath("/mesas-publicas")).toBe(false);
  });
});
