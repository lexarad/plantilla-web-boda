function normalizeCsvHeader(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Tokeniza el CSV entero de una pasada respetando comillas: un campo
// entrecomillado puede contener comas, comillas escapadas ("") y SALTOS DE
// LÍNEA — el propio stringifyCsv de abajo los exporta así (y Excel también),
// por lo que partir por líneas antes de parsear rompía el round-trip.
function tokenizeCsv(input: string): string[][] {
  const text = input.replace(/\r\n/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }

    if (char === "\n") {
      row.push(current.trim());
      current = "";
      rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  rows.push(row);

  return rows.filter((cells) => cells.some((value) => value.length > 0));
}

export function parseCsvRecords(input: string) {
  const rows = tokenizeCsv(input);

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(normalizeCsvHeader);

  return rows.slice(1).map((values) => {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    return record;
  });
}

export function normalizeCsvHeaderValue(value: string) {
  return normalizeCsvHeader(value);
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function stringifyCsv(records: Record<string, string>[]) {
  if (records.length === 0) {
    return "";
  }

  const headers = Object.keys(records[0]);
  const lines = [headers.join(",")];

  for (const record of records) {
    lines.push(headers.map((header) => escapeCsvValue(record[header] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}
