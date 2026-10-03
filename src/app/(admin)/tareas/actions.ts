"use server";

import { revalidatePath } from "next/cache";
import { deleteSchema, taskSchema, updateTaskSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { createDemoTask, deleteDemoTask, updateDemoTask } from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createTaskAction(formData: FormData) {
  const values = taskSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await createDemoTask(values);
    revalidatePath("/dashboard");
    revalidatePath("/tareas");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("tareas").insert(values);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tareas");
}

export async function updateTaskAction(formData: FormData) {
  const { id, ...values } = updateTaskSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoTask(id, values);
    revalidatePath("/dashboard");
    revalidatePath("/tareas");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("tareas").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tareas");
}

export async function deleteTaskAction(formData: FormData) {
  const { id } = deleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await deleteDemoTask(id);
    revalidatePath("/dashboard");
    revalidatePath("/tareas");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("tareas").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tareas");
}
