import { describe, expect, it } from "vitest";
import { formatDate, formatLongDate, getWeddingDetails } from "./wedding-details";

describe("fechas de la boda", () => {
  it("formatea en castellano y catalán en la zona horaria de la boda", () => {
    // 23:30 UTC del 17 es ya día 18 en Madrid.
    const iso = "2027-09-17T23:30:00Z";
    expect(formatDate(iso, "es")).toBe("18 de septiembre de 2027");
    expect(formatDate(iso, "ca")).toMatch(/^18 de setembre de?l? 2027$/);
    expect(formatLongDate(iso, "es")).toMatch(/^Sábado/);
  });

  it("los detalles salen de la configuración en los dos idiomas", () => {
    const es = getWeddingDetails("es");
    const ca = getWeddingDetails("ca");
    expect(es.eventDateTimeIso).toBe(ca.eventDateTimeIso);
    expect(es.dateLabel).not.toBe(ca.dateLabel);
    expect(es.venueName.length).toBeGreaterThan(0);
  });
});
