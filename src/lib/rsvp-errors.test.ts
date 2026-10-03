import { describe, expect, it } from "vitest";
import { classifyRsvpError, getRsvpErrorMessage, type RsvpErrorCode } from "@/lib/rsvp-errors";

describe("classifyRsvpError", () => {
  it("reconoce los fallos de red reintentables", () => {
    expect(classifyRsvpError({ message: "fetch failed" })).toBe("red");
    expect(classifyRsvpError({ name: "AuthRetryableFetchError", message: "" })).toBe("red");
    expect(classifyRsvpError({ message: "connect ETIMEDOUT" })).toBe("red");
    expect(classifyRsvpError({ message: "getaddrinfo ENOTFOUND db.supabase.co" })).toBe("red");
  });

  it("el resto de fallos son de guardado", () => {
    expect(classifyRsvpError({ message: 'new row violates check constraint "menu_check"' })).toBe("guardar");
    expect(classifyRsvpError({})).toBe("guardar");
  });
});

describe("getRsvpErrorMessage", () => {
  const codigos: RsvpErrorCode[] = ["datos", "red", "guardar"];

  it("responde en los dos idiomas de la boda", () => {
    for (const codigo of codigos) {
      expect(getRsvpErrorMessage(codigo, "es").length).toBeGreaterThan(30);
      expect(getRsvpErrorMessage(codigo, "ca").length).toBeGreaterThan(30);
      expect(getRsvpErrorMessage(codigo, "es")).not.toBe(getRsvpErrorMessage(codigo, "ca"));
    }
  });

  it("nunca enseña jerga técnica al invitado", () => {
    for (const codigo of codigos) {
      for (const locale of ["es", "ca"] as const) {
        expect(getRsvpErrorMessage(codigo, locale)).not.toMatch(/fetch|supabase|rpc|token|null|undefined|500/i);
      }
    }
  });

  it("tranquiliza sobre lo escrito en los fallos reintentables", () => {
    expect(getRsvpErrorMessage("red", "es")).toMatch(/sigue aquí|no se ha perdido/i);
    expect(getRsvpErrorMessage("datos", "es")).toMatch(/no se ha perdido/i);
  });
});
