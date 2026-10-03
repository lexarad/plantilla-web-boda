import { z } from "zod";
import { menuChoiceValues } from "@/lib/rsvp-options";

const nullableText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const requiredText = (label: string) => z.string().trim().min(1, `${label} es obligatorio.`);

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim().toLowerCase();
}, z.string().email("Email no valido.").nullable());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}, z.string().nullable());

// Acepta tanto "1234.56" como el formato español "1.234,56" / "50,5":
// si hay coma, los puntos son separadores de miles y la coma es el decimal.
const money = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return 0;
  }

  let text = value.trim().replace(/[€\s]/g, "");
  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  }

  return Number(text);
}, z.number().finite().min(0));

// Acepta el "on" de los formularios HTML, el "true" textual, y booleanos ya
// convertidos (p.ej. la importación CSV pasa un boolean de parseBooleanField).
// Antes solo comparaba strings, así que un boolean true se convertía en false
// y toda importación de CSV guardaba necesita_autobus=false silenciosamente.
const checkbox = z.preprocess(
  (value) => value === true || value === "on" || value === "true",
  z.boolean()
);

const multilineTextArray = z.preprocess((value) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}, z.array(z.string().min(1)));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email no valido.")
});

export const guestSchema = z.object({
  nombre: requiredText("El nombre"),
  apellidos: requiredText("Los apellidos"),
  email: optionalEmail,
  telefono: nullableText,
  grupo: nullableText,
  confirmacion_asistencia: z.enum(["pendiente", "confirmado", "rechazado"]),
  menu_elegido: z.enum(menuChoiceValues),
  alergias_intolerancias: nullableText,
  necesita_autobus: checkbox,
  hotel_alojamiento: nullableText,
  mesa_id: nullableText,
  notas_internas: nullableText,
  cancion_sugerida: nullableText.optional()
});

export const updateGuestSchema = guestSchema.extend({
  id: z.string().uuid()
});

export const tableSchema = z.object({
  nombre: requiredText("El nombre"),
  capacidad: z.coerce.number().int().min(1, "La capacidad debe ser al menos 1."),
  notas: nullableText
});

export const updateTableSchema = tableSchema.extend({
  id: z.string().uuid()
});

export const assignGuestTableSchema = z.object({
  guest_id: z.string().uuid(),
  mesa_id: nullableText
});

export const deleteSchema = z.object({
  id: z.string().uuid()
});

export const tableDeleteSchema = deleteSchema;

export const busSchema = z.object({
  nombre: requiredText("El nombre"),
  proveedor: nullableText,
  capacidad: z.coerce.number().int().min(1, "La capacidad debe ser al menos 1."),
  paradas: multilineTextArray,
  horarios: nullableText,
  estado: z.enum(["borrador", "cotizado", "confirmado"]),
  notas: nullableText
});

export const updateBusSchema = busSchema.extend({
  id: z.string().uuid()
});

export const busDeleteSchema = deleteSchema;

export const assignGuestBusSchema = z.object({
  guest_id: z.string().uuid(),
  autobus_id: nullableText
});

export const supplierSchema = z.object({
  nombre: requiredText("El nombre"),
  tipo: requiredText("El tipo"),
  email: optionalEmail,
  telefono: nullableText,
  web: nullableText,
  precio: money,
  estado: z.enum(["idea", "contactado", "cotizado", "reservado", "pagado"]),
  notas: nullableText
});

export const updateSupplierSchema = supplierSchema.extend({
  id: z.string().uuid()
});

export const supplierDeleteSchema = deleteSchema;

export const documentSchema = z.object({
  nombre: requiredText("El nombre"),
  tipo: requiredText("El tipo"),
  proveedor_id: nullableText,
  notas: nullableText
});

export const updateDocumentSchema = documentSchema.extend({
  id: z.string().uuid()
});

export const documentDeleteSchema = deleteSchema;

export const rsvpTouchSchema = z.object({
  token: z.string().trim().min(4),
  lang: z.enum(["es", "ca"]).optional()
});

export const taskSchema = z.object({
  titulo: requiredText("El titulo"),
  descripcion: nullableText,
  responsable: z.enum(["uno", "dos", "ambos"]),
  fecha_limite: optionalDate,
  estado: z.enum(["pendiente", "en_progreso", "hecha"]),
  prioridad: z.enum(["baja", "media", "alta"])
});

export const updateTaskSchema = taskSchema.extend({
  id: z.string().uuid()
});

export const budgetSchema = z.object({
  categoria: requiredText("La categoria"),
  concepto: requiredText("El concepto"),
  proveedor: nullableText,
  coste_estimado: money,
  coste_real: money,
  estado_pago: z.enum(["pendiente", "parcial", "pagado"]),
  fecha_pago: optionalDate,
  notas: nullableText
});

export const updateBudgetSchema = budgetSchema.extend({
  id: z.string().uuid()
});

export const timelineEventSchema = z.object({
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  titulo: requiredText("El titulo"),
  descripcion: nullableText,
  titulo_ca: nullableText,
  descripcion_ca: nullableText
});

export const updateTimelineEventSchema = timelineEventSchema.extend({
  id: z.string().uuid()
});

export const rsvpSchema = z.object({
  token: z.string().trim().min(4),
  confirmacion_asistencia: z.enum(["confirmado", "rechazado"]),
  menu_elegido: z.enum(["adulto", "vegetariano", "vegano", "sin_gluten", "sin_lactosa", "infantil", "especial"]),
  alergias_intolerancias: nullableText,
  necesita_autobus: checkbox,
  hotel_alojamiento: nullableText,
  comentarios: nullableText,
  cancion_sugerida: nullableText
});
