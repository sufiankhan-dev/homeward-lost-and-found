import type { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionFailure = {
  ok: false;
  error: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T = null> = { ok: true; data: T } | ActionFailure;

export function validationFailure(error: z.ZodError): ActionFailure {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    ok: false,
    error: "Some details need attention. Check the highlighted fields.",
    fieldErrors,
  };
}

export const failure = (error: string): ActionFailure => ({ ok: false, error });

export const success = <T>(data: T): { ok: true; data: T } => ({ ok: true, data });
