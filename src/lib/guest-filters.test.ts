import { describe, expect, it } from "vitest";
import { matchesGuestSearch, filterGuests } from "./guest-filters";
import type { Guest } from "@/lib/types";

function guest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: "1",
    nombre: "José",
    apellidos: "Martínez Núñez",
    email: null,
    telefono: null,
    grupo: "Familia",
    confirmacion_asistencia: "pendiente",
    menu_elegido: "pendiente",
    alergias_intolerancias: null,
    necesita_autobus: false,
    hotel_alojamiento: null,
    mesa_id: null,
    mesa_nombre: null,
    notas_internas: null,
    comentarios: null,
    codigo_invitacion: "ABC12",
    ...overrides
  } as Guest;
}

describe("matchesGuestSearch (insensible a acentos)", () => {
  it("encuentra 'José' buscando 'jose' (sin tilde)", () => {
    expect(matchesGuestSearch(guest(), "jose")).toBe(true);
  });

  it("encuentra 'José' buscando 'José' (con tilde)", () => {
    expect(matchesGuestSearch(guest(), "José")).toBe(true);
  });

  it("encuentra apellidos con tilde buscando sin tilde", () => {
    expect(matchesGuestSearch(guest(), "martinez")).toBe(true);
    expect(matchesGuestSearch(guest(), "nunez")).toBe(true);
  });

  it("no encuentra lo que no está", () => {
    expect(matchesGuestSearch(guest(), "pedro")).toBe(false);
  });

  it("busca por código de invitación en minúsculas", () => {
    expect(matchesGuestSearch(guest(), "abc12")).toBe(true);
  });
});

describe("filterGuests", () => {
  it("filtra por query normalizada sin acentos", () => {
    const guests = [guest({ id: "1", nombre: "José" }), guest({ id: "2", nombre: "Marta", apellidos: "López" })];
    const result = filterGuests(guests, { q: "jose" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("combina filtro de estado y búsqueda", () => {
    const guests = [
      guest({ id: "1", confirmacion_asistencia: "confirmado" }),
      guest({ id: "2", confirmacion_asistencia: "pendiente" })
    ];
    const result = filterGuests(guests, { estado: "confirmado" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});
