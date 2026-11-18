"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signInSchema, signUpSchema } from "@/lib/validation";

type Errors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

function friendlyAuthError(code: string | undefined, message: string | undefined, mode: "sign-in" | "sign-up") {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match an account. Check for typos, or create an account.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Try signing in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Password needs at least 8 characters.";
    default:
      if (message?.toLowerCase().includes("too many")) return "Too many attempts. Please wait a minute and try again.";
      return mode === "sign-in" ? "We couldn't sign you in. Please try again." : "We couldn't create your account. Please try again.";
  }
}

export function AuthForm({ mode, next }: { mode: "sign-in" | "sign-up"; next: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";

  const update = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = isSignUp ? signUpSchema.safeParse(values) : signInSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`auth-${first}`)?.focus();
      return;
    }

    startTransition(async () => {
      const { error } = isSignUp
        ? await authClient.signUp.email({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await authClient.signIn.email({ email: values.email.trim(), password: values.password });
      if (error) {
        setFormError(friendlyAuthError(error.code, error.message, mode));
        return;
      }
      toast.success(isSignUp ? "Welcome to Homeward! Your account is ready." : "Signed in. Welcome back!");
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </p>
      )}
      {isSignUp && (
        <Field id="auth-name" label="Your name" hint="Others only see your first name." error={errors.name} required>
          {(props) => <Input {...props} value={values.name} onChange={update("name")} autoComplete="name" maxLength={60} />}
        </Field>
      )}
      <Field
        id="auth-email"
        label="Email"
        hint={isSignUp ? "Used to sign in. Never shown to other people." : undefined}
        error={errors.email}
        required
      >
        {(props) => (
          <Input {...props} type="email" value={values.email} onChange={update("email")} autoComplete="email" inputMode="email" />
        )}
      </Field>
      <Field id="auth-password" label="Password" hint={isSignUp ? "At least 8 characters." : undefined} error={errors.password} required>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={update("password")}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
        )}
      </Field>
      {isSignUp && (
        <Field id="auth-confirmPassword" label="Confirm password" error={errors.confirmPassword} required>
          {(props) => (
            <Input
              {...props}
              type={showPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
            />
          )}
        </Field>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to Homeward? "}
        <Link
          href={`${isSignUp ? "/sign-in" : "/sign-up"}${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}
