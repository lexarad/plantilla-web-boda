const DIACRITICS = /[̀-ͯ]/g;

/**
 * Normaliza texto para búsquedas insensibles a acentos y mayúsculas.
 * Fuente ÚNICA de verdad: antes estaba duplicada en varios ficheros y la
 * divergencia provocó que las búsquedas del panel no encontraran nombres con
 * tilde (p.ej. "jose" no encontraba "José") porque solo se normalizaba la
 * query y no el texto donde se buscaba.
 */
export function normalizeText(value: string) {
  return value.normalize("NFKD").replace(DIACRITICS, "").trim().toLowerCase();
}
