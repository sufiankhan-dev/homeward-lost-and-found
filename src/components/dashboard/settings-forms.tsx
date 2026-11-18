"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/lib/profile/actions";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const changed = name.trim() !== initialName;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile({ name });
          if (!result.ok) {
            setError(result.fieldErrors?.name?.[0] ?? result.error);
            return;
          }
          setError(undefined);
          toast.success("Your name has been updated.");
          router.refresh();
        });
      }}
    >
      <Field id="profile-name" label="Name" hint="Other people only see your first name." error={error} required>
        {(props) => <Input {...props} value={name} maxLength={60} autoComplete="name" onChange={(e) => setName(e.target.value)} />}
      </Field>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Email</p>
        <p className="text-sm text-muted-foreground">{email} · private, never shown to other users</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !changed}>
          {pending ? "Saving…" : "Save name"}
        </Button>
        {changed && (
          <Button type="button" variant="ghost" onClick={() => setName(initialName)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.current) next.current = "Enter your current password.";
    if (values.next.length < 8) next.next = "New password needs at least 8 characters.";
    if (values.next !== values.confirm) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: values.current,
        newPassword: values.next,
        revokeOtherSessions: true,
      });
      if (error) {
        setErrors({
          current: error.code === "INVALID_PASSWORD" ? "Your current password is incorrect." : "We couldn't change your password. Try again.",
        });
        return;
      }
      setValues({ current: "", next: "", confirm: "" });
      toast.success("Password changed. Other devices have been signed out.");
    });
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <Field id="pw-current" label="Current password" error={errors.current} required>
        {(props) => <Input {...props} type="password" autoComplete="current-password" value={values.current} onChange={set("current")} />}
      </Field>
      <Field id="pw-new" label="New password" hint="At least 8 characters." error={errors.next} required>
        {(props) => <Input {...props} type="password" autoComplete="new-password" value={values.next} onChange={set("next")} />}
      </Field>
      <Field id="pw-confirm" label="Confirm new password" error={errors.confirm} required>
        {(props) => <Input {...props} type="password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} />}
      </Field>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}
