import path from "path";

export const DOCUMENTS_BUCKET = "documentos-boda";

function sanitizeSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildDocumentStoragePath(documentId: string, fileName: string) {
  const parsed = path.parse(fileName);
  const baseName = sanitizeSegment(parsed.name) || "archivo";
  const extension = parsed.ext.toLowerCase();

  return `${documentId}/${baseName}${extension}`;
}
