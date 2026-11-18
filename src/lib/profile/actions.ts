"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { failure, success, validationFailure, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/session";
import { profileSchema } from "@/lib/validation";

export async function updateProfile(input: { name: string }): Promise<ActionResult<{ name: string }>> {
  const current = await getCurrentUser();
  if (!current) return failure("Please sign in to continue.");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  await db.update(user).set({ name: parsed.data.name }).where(eq(user.id, current.id));
  revalidatePath("/", "layout");
  return success({ name: parsed.data.name });
}
