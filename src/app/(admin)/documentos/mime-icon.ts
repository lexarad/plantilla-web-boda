import { Archive, FileImage, FileSpreadsheet, FileText, FileType } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Icono + tono por tipo de archivo. Los tonos usan los tokens semánticos del
 * sistema (no colores ad hoc): cada categoría toma prestado el tono que mejor
 * encaja visualmente, no un significado de estado.
 */
export function iconForMime(mime: string | null, name: string): { Icon: LucideIcon; className: string } {
  const lower = (mime ?? name).toLowerCase();

  if (lower.includes("image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
    return { Icon: FileImage, className: "bg-info/10 text-info" };
  }
  if (lower.includes("spreadsheet") || /\.(xlsx?|csv)$/i.test(name)) {
    return { Icon: FileSpreadsheet, className: "bg-success/10 text-success" };
  }
  if (lower.includes("pdf") || /\.pdf$/i.test(name)) {
    return { Icon: FileType, className: "bg-destructive/10 text-destructive" };
  }
  if (lower.includes("zip") || /\.(zip|rar|7z)$/i.test(name)) {
    return { Icon: Archive, className: "bg-warning/10 text-warning" };
  }
  return { Icon: FileText, className: "bg-primary/10 text-primary" };
}
