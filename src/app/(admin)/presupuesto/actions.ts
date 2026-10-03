"use server";

import { revalidatePath } from "next/cache";
import { budgetSchema, deleteSchema, updateBudgetSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { createDemoBudgetItem, deleteDemoBudgetItem, updateDemoBudgetItem } from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createBudgetAction(formData: FormData) {
  const values = budgetSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await createDemoBudgetItem(values);
    revalidatePath("/dashboard");
    revalidatePath("/presupuesto");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("gastos").insert(values);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
}

export async function updateBudgetAction(formData: FormData) {
  const { id, ...values } = updateBudgetSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoBudgetItem(id, values);
    revalidatePath("/dashboard");
    revalidatePath("/presupuesto");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("gastos").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
}

export async function deleteBudgetAction(formData: FormData) {
  const { id } = deleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await deleteDemoBudgetItem(id);
    revalidatePath("/dashboard");
    revalidatePath("/presupuesto");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("gastos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
}
