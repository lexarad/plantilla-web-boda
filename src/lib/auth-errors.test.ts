import { describe, expect, it } from "vitest";
import { classifyAuthError, genericLoginErrorMessage, getLoginErrorMessage } from "./auth-errors";

describe("classifyAuthError", () => {
  it.each([
    // Caso real: proyecto de Supabase pausado (auth-js no lanza, devuelve el error).
    { name: "AuthRetryableFetchError", message: "fetch failed", status: 0 },
    { name: "TypeError", message: "TypeError: fetch failed" },
    { name: "AuthRetryableFetchError", message: "Failed to fetch" },
    { name: "Error", message: "connect ECONNREFUSED 127.0.0.1:443" },
    { name: "Error", message: "network timeout" }
  ])("clasifica como fallo de red %o", (error) => {
    expect(classifyAuthError(error)).toBe("red");
  });

  it.each([
    { name: "AuthApiError", message: "For security purposes, you can only request this after 57 seconds." },
    { name: "AuthApiError", message: "email rate limit exceeded", status: 429 },
    { name: "AuthApiError", message: "Request rate limit reached" },
    { name: "AuthApiError", message: "Too Many Requests", status: 429 }
  ])("clasifica como límite de envíos %o", (error) => {
    expect(classifyAuthError(error)).toBe("rate-limit");
  });

  it("clasifica como desconocido cualquier otro mensaje", () => {
    expect(classifyAuthError({ name: "AuthApiError", message: "Something else went wrong" })).toBe("desconocido");
    expect(classifyAuthError({})).toBe("desconocido");
  });
});

describe("getLoginErrorMessage", () => {
  it.each(["supabase", "email", "no-autorizado", "auth", "red", "rate-limit"])(
    "devuelve un mensaje propio para el código %s",
    (code) => {
      expect(getLoginErrorMessage(code)).not.toBe(genericLoginErrorMessage);
    }
  );

  it("nunca devuelve el texto crudo recibido en la URL", () => {
    // Un mensaje técnico crudo («fetch failed») nunca debe llegar a la pantalla.
    expect(getLoginErrorMessage("fetch failed")).toBe(genericLoginErrorMessage);
    expect(getLoginErrorMessage("desconocido")).toBe(genericLoginErrorMessage);
    expect(getLoginErrorMessage("")).toBe(genericLoginErrorMessage);
  });

  it("todos los mensajes están en español y sin jerga técnica", () => {
    const codigos = ["supabase", "email", "no-autorizado", "auth", "red", "rate-limit", "desconocido"];

    for (const codigo of codigos) {
      const mensaje = getLoginErrorMessage(codigo);
      // Jerga técnica que nunca debe llegar a la pantalla. «error» no entra en la
      // lista: es una palabra española normal y prohibirla veta redacciones válidas.
      expect(mensaje).not.toMatch(/fetch|supabase|\.env|token|null|undefined|429/i);
      expect(mensaje.length).toBeGreaterThan(20);
    }
  });
});
