import { describe, expect, it } from "vitest";
import { parseCsvRecords, stringifyCsv, normalizeCsvHeaderValue } from "./csv";

describe("normalizeCsvHeaderValue", () => {
  it("normaliza acentos, espacios y mayúsculas a snake_case", () => {
    expect(normalizeCsvHeaderValue("Alergias e Intolerancias")).toBe("alergias_e_intolerancias");
    expect(normalizeCsvHeaderValue("  Teléfono  ")).toBe("telefono");
  });
});

describe("parseCsvRecords", () => {
  it("mapea cabeceras normalizadas a valores", () => {
    const records = parseCsvRecords("Nombre,Apellidos\nAna,López");
    expect(records).toEqual([{ nombre: "Ana", apellidos: "López" }]);
  });

  it("respeta comas dentro de comillas", () => {
    const records = parseCsvRecords('nombre,notas\nAna,"hola, que tal"');
    expect(records[0].notas).toBe("hola, que tal");
  });

  it("interpreta comillas escapadas (\"\")", () => {
    const records = parseCsvRecords('nombre,notas\nAna,"dijo ""hola"""');
    expect(records[0].notas).toBe('dijo "hola"');
  });

  it("devuelve [] con entrada vacía", () => {
    expect(parseCsvRecords("")).toEqual([]);
  });
});

describe("stringifyCsv", () => {
  it("escapa comas, comillas y saltos de línea", () => {
    const csv = stringifyCsv([{ a: "x,y", b: 'di "hola"' }]);
    expect(csv).toBe('a,b\n"x,y","di ""hola"""\n');
  });

  it("devuelve cadena vacía sin registros", () => {
    expect(stringifyCsv([])).toBe("");
  });

  it("hace round-trip de un valor con coma", () => {
    const original = [{ nombre: "Ana", notas: "hola, que tal" }];
    const parsed = parseCsvRecords(stringifyCsv(original));
    expect(parsed).toEqual(original);
  });
});

describe("parseCsvRecords con saltos de línea entrecomillados", () => {
  it("parsea un campo multilínea (regresión: antes partía la fila)", () => {
    const csv = 'nombre,notas\nAna,"línea 1\nlínea 2"\nLuis,simple\n';
    const rows = parseCsvRecords(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].notas).toBe("línea 1\nlínea 2");
    expect(rows[1].nombre).toBe("Luis");
  });

  it("hace round-trip de un valor con salto de línea", () => {
    const original = [{ nombre: "Ana", notas: "alergia:\nfrutos secos" }];
    const rows = parseCsvRecords(stringifyCsv(original));
    expect(rows[0].notas).toBe("alergia:\nfrutos secos");
  });

  it("acepta CRLF dentro de un campo entrecomillado", () => {
    const csv = 'nombre,notas\r\nAna,"a\r\nb"\r\n';
    const rows = parseCsvRecords(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].notas).toBe("a\nb");
  });
});
