"use server";

import { revalidatePath } from "next/cache";
import { updateDemoSettings } from "@/lib/demo-store";
import { shouldUseDemoStore } from "@/lib/actions/guards";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateSettingsAction(formData: FormData) {
  // Mismo guard que el resto de mutaciones del panel: lanza en producción sin
  // Supabase (isDemoMode && !isDemoAllowed) para no escribir el store demo vía
  // POST directo sin autenticar. Antes usaba un `if (!isDemoMode())` crudo que
  // dejaba escribir el IBAN (vector de fraude de pagos) sin ningún guard.
  const useDemo = await shouldUseDemoStore();

  const values = {
    iban: str(formData, "iban"),
    ibanHolder: str(formData, "ibanHolder"),
    ibanConcept: str(formData, "ibanConcept"),
    contactPhone: str(formData, "contactPhone"),
    contactEmail: str(formData, "contactEmail"),
    hotelSuggestions: str(formData, "hotelSuggestions")
  };

  if (!useDemo) {
    // En modo Supabase los ajustes vienen de variables de entorno.
    return;
  }

  await updateDemoSettings(values);
  revalidatePath("/ajustes");
  revalidatePath("/regalo");
  revalidatePath("/informacion");
}
