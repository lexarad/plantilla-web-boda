export const menuChoiceValues = [
  "pendiente",
  "adulto",
  "vegetariano",
  "vegano",
  "sin_gluten",
  "sin_lactosa",
  "infantil",
  "especial"
] as const;

export const menuChoiceOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "adulto", label: "Adulto" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "sin_lactosa", label: "Sin lactosa" },
  { value: "infantil", label: "Infantil" },
  { value: "especial", label: "Especial" }
] as const;

export const rsvpDecisionOptions = [
  { value: "confirmado", label: "Si, asistire" },
  { value: "rechazado", label: "No puedo asistir" }
] as const;
