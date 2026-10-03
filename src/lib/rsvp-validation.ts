/**
 * Funciones puras de validación por paso del RSVP wizard.
 * Cada función devuelve { ok, errors } donde errors es un array de { field, message }.
 * No tiene efectos secundarios ni dependencias de React.
 */

export type RsvpStep = 0 | 1 | 2 | 3 | 4;

export type RsvpValidationError = { field: string; message: string };

export type RsvpValidationResult = { ok: boolean; errors: RsvpValidationError[] };

/**
 * Estado del wizard. Refleja exactamente los campos de rsvp-wizard.tsx.
 */
export type WizardState = {
  attendance: "confirmado" | "rechazado";
  menu: string;
  hasAllergies: boolean;
  allergies: string;
  bus: boolean;
  hotel: string;
  comments: string;
  song: string;
};

const VALID_MENU_VALUES = [
  "adulto",
  "vegetariano",
  "vegano",
  "sin_gluten",
  "sin_lactosa",
  "infantil",
  "especial"
] as const;

/**
 * Paso 0 (asistencia): attendance debe ser "confirmado" o "rechazado".
 * En la práctica siempre tiene valor por defecto, pero validamos igualmente.
 */
function validateStep0(state: WizardState): RsvpValidationResult {
  if (state.attendance !== "confirmado" && state.attendance !== "rechazado") {
    return {
      ok: false,
      errors: [{ field: "attendance", message: "Cuéntanos si vendrás a la boda" }]
    };
  }
  return { ok: true, errors: [] };
}

/**
 * Paso 1 (menú): si attendance === "confirmado", menu debe ser una opción válida.
 * Si attendance === "rechazado", el paso no aplica (el wizard salta al paso 4).
 */
function validateStep1(state: WizardState): RsvpValidationResult {
  if (state.attendance === "rechazado") {
    return { ok: true, errors: [] };
  }
  const validValues: readonly string[] = VALID_MENU_VALUES;
  if (!validValues.includes(state.menu)) {
    return {
      ok: false,
      errors: [{ field: "menu", message: "Elige una opción de menú para continuar" }]
    };
  }
  return { ok: true, errors: [] };
}

/**
 * Paso 2 (alergias): si hasAllergies=true, allergies debe tener texto.
 */
function validateStep2(state: WizardState): RsvpValidationResult {
  if (state.hasAllergies && state.allergies.trim().length === 0) {
    return {
      ok: false,
      errors: [
        {
          field: "allergies",
          message: "Cuéntanos qué alergias o intolerancias tienes"
        }
      ]
    };
  }
  return { ok: true, errors: [] };
}

/**
 * Paso 3 (logística): bus y hotel son opcionales — siempre pasa.
 */
function validateStep3(_state: WizardState): RsvpValidationResult {
  return { ok: true, errors: [] };
}

/**
 * Paso 4 (revisión/final): sin campos requeridos — siempre pasa.
 */
function validateStep4(_state: WizardState): RsvpValidationResult {
  return { ok: true, errors: [] };
}

/**
 * Punto de entrada: valida el estado del wizard para un índice de paso concreto.
 * El índice es el currentStepIdx (0-4), NO el índice en el array steps[].
 */
export function validateStep(stepIdx: RsvpStep, state: WizardState): RsvpValidationResult {
  switch (stepIdx) {
    case 0:
      return validateStep0(state);
    case 1:
      return validateStep1(state);
    case 2:
      return validateStep2(state);
    case 3:
      return validateStep3(state);
    case 4:
      return validateStep4(state);
    default: {
      // Exhaustive check — TypeScript debería atrapar esto en compile time
      const _exhaustive: never = stepIdx;
      void _exhaustive;
      return { ok: true, errors: [] };
    }
  }
}

/**
 * Dado el array `steps` (ej. [0,1,2,3,4] o [0,4]) y el índice `step` en ese array,
 * devuelve el currentStepIdx para pasar a validateStep.
 */
export function resolveStepIdx(steps: number[], stepIndex: number): RsvpStep {
  const idx = steps[stepIndex] ?? 0;
  return Math.min(4, Math.max(0, idx)) as RsvpStep;
}
