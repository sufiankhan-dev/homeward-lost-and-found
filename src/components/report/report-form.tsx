"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Lock, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form/field";
import { CategoryIcon } from "@/components/items/category-icon";
import { ReportTypeBadge } from "@/components/items/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CAMPUS_LOCATIONS, CONTACT_PREFERENCE_INFO, CONTACT_PREFERENCES, type ReportType } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { createReport, updateReport } from "@/lib/items/actions";
import { cn } from "@/lib/utils";
import { reportFormSchema, type ReportFormInput, type ReportFormValues } from "@/lib/validation";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";

type Category = { id: number; name: string; slug: string; icon: string };
type FormFields = FieldPath<ReportFormInput>;

const STEPS: { title: string; short: string; fields: FormFields[] }[] = [
  { title: "What is the item?", short: "Item", fields: ["title", "categoryId", "description"] },
  { title: "When and where?", short: "When & where", fields: ["eventDate", "generalLocation"] },
  { title: "Photos and details", short: "Details", fields: ["distinguishingFeatures", "verificationDetails", "contactPreference", "imageIds"] },
  { title: "Review and submit", short: "Review", fields: [] },
];

const FIELD_LABELS: Partial<Record<FormFields, string>> = {
  title: "Item name",
  categoryId: "Category",
  description: "Description",
  eventDate: "Date",
  generalLocation: "Location",
  distinguishingFeatures: "Distinguishing features",
  verificationDetails: "Private verification details",
};

const today = () => new Date().toISOString().slice(0, 10);

export function ReportForm({
  mode,
  reportType,
  categories,
  itemId,
  initialValues,
  initialPhotos = [],
}: {
  mode: "create" | "edit";
  reportType: ReportType;
  categories: Category[];
  itemId?: string;
  initialValues?: Partial<ReportFormInput>;
  initialPhotos?: UploadedPhoto[];
}) {
  const router = useRouter();
  const isLost = reportType === "LOST";
  const draftKey = `homeward-draft-${reportType}`;
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(mode === "edit" ? STEPS.length - 1 : 0);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  /**
   * Errors captured at the last Continue/Submit attempt. The summary keeps
   * these rows (marking fixed ones) instead of removing them on blur, so the
   * layout never jumps under the user's pointer.
   */
  const [attempt, setAttempt] = useState<{ step: number; fields: { name: FormFields; message: string }[] } | null>(null);

  const form = useForm<ReportFormInput, unknown, ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onTouched",
    defaultValues: {
      reportType,
      title: "",
      categoryId: undefined,
      description: "",
      eventDate: today(),
      generalLocation: "",
      distinguishingFeatures: "",
      verificationDetails: "",
      contactPreference: "IN_APP",
      imageIds: [],
      ...initialValues,
    },
  });
  const { register, formState, trigger, getValues, setValue, watch, setError, setFocus } = form;
  const { errors } = formState;

  // Restore a saved draft (create mode only) so interrupted users don't lose work.
  useEffect(() => {
    if (mode !== "create") return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<ReportFormInput>;
      const { imageIds: _ignored, ...rest } = draft;
      void _ignored;
      form.reset({ ...getValues(), ...rest, reportType });
      setDraftRestored(true);
    } catch {
      /* ignore corrupt drafts */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "create") return;
    // Subscription-style watch is intentional: it saves drafts without re-rendering.
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = watch((values) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ ...values, imageIds: [] }));
      } catch {
        /* storage full or unavailable */
      }
    });
    return () => sub.unsubscribe();
  }, [watch, mode, draftKey]);

  useEffect(() => {
    setValue("imageIds", photos.map((p) => p.id));
  }, [photos, setValue]);

  function discardDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    form.reset({ reportType, title: "", description: "", eventDate: today(), generalLocation: "", contactPreference: "IN_APP", imageIds: [], distinguishingFeatures: "", verificationDetails: "" });
    setDraftRestored(false);
    setStep(0);
  }

  function captureAttempt(forStep: number) {
    const fields = STEPS[forStep].fields.flatMap((name) => {
      const message = form.getFieldState(name).error?.message;
      return message ? [{ name, message }] : [];
    });
    setAttempt(fields.length ? { step: forStep, fields } : null);
  }

  function goTo(next: number) {
    setAttempt((a) => (a && a.step === next ? a : null));
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  // After a failed attempt, re-validate fields with errors as the user types,
  // so messages clear immediately (feedback) instead of on blur, when the
  // layout shift could make the user's Continue click miss.
  useEffect(() => {
    if (!attempt) return;
    const sub = watch((_values, { name }) => {
      if (name && form.getFieldState(name).error) void trigger(name);
    });
    return () => sub.unsubscribe();
  }, [attempt, watch, trigger, form]);

  async function nextStep() {
    // Decide validity from the current values directly. RHF's trigger() can
    // report stale results while a blur validation is still running, which
    // made Continue occasionally need a second click.
    const fields = STEPS[step].fields;
    const parsed = await reportFormSchema.safeParseAsync(getValues());
    const stepInvalid =
      !parsed.success && parsed.error.issues.some((issue) => fields.includes(issue.path[0] as FormFields));
    if (!stepInvalid) {
      form.clearErrors(fields);
      goTo(step + 1);
      return;
    }
    const valid = await trigger(fields, { shouldFocus: true });
    if (!valid) {
      captureAttempt(step);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    goTo(step + 1);
  }

  function submit() {
    setServerError(null);
    form.handleSubmit(
      (values) =>
        startTransition(async () => {
          const result = mode === "create" ? await createReport(values) : await updateReport(itemId!, values);
          if (!result.ok) {
            setServerError(result.error);
            if (result.fieldErrors) {
              let firstStep = STEPS.length - 1;
              for (const [field, messages] of Object.entries(result.fieldErrors)) {
                if (!messages?.length) continue;
                setError(field as FormFields, { message: messages[0] });
                const idx = STEPS.findIndex((s) => s.fields.includes(field as FormFields));
                if (idx >= 0) firstStep = Math.min(firstStep, idx);
              }
              goTo(firstStep);
              requestAnimationFrame(() => captureAttempt(firstStep));
            }
            return;
          }
          if (mode === "create") {
            try {
              localStorage.removeItem(draftKey);
            } catch {
              /* ignore */
            }
            setSubmitted({ id: result.data.id });
            window.scrollTo({ top: 0 });
          } else {
            toast.success("Your changes have been saved.");
            router.push(`/items/${result.data.id}`);
            router.refresh();
          }
        }),
      () => {
        const idx = Math.max(0, STEPS.findIndex((s) => s.fields.some((f) => form.getFieldState(f).invalid)));
        goTo(idx);
        requestAnimationFrame(() => captureAttempt(idx));
      },
    )();
  }

  if (submitted) {
    return <SubmissionConfirmation id={submitted.id} isLost={isLost} />;
  }

  const summaryRows = attempt && attempt.step === step ? attempt.fields : [];
  const values = watch();
  const category = categories.find((c) => c.id === Number(values.categoryId));

  return (
    <div className="space-y-6">
      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/60 px-4 py-3 text-sm" role="status">
          <span>We restored the draft you started earlier on this device.</span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            <Trash2 aria-hidden /> Start over
          </Button>
        </div>
      )}

      {/* Progress: where am I, what's left (visibility, reduces memory load). */}
      <nav aria-label="Form progress">
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const done = i < step || (mode === "edit" && i !== step);
            const reachable = i <= maxVisited;
            return (
              <li key={s.short}>
                <button
                  type="button"
                  disabled={!reachable || pending}
                  onClick={() => goTo(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "flex w-full flex-col items-start gap-1.5 text-left disabled:cursor-default",
                    reachable && i !== step && "hover:opacity-80",
                  )}
                >
                  <span className={cn("h-1.5 w-full rounded-full bg-muted", (i <= step || done) && "bg-primary")} aria-hidden />
                  <span className={cn("flex items-center gap-1 text-xs font-medium text-muted-foreground", i === step && "text-foreground")}>
                    {done && i !== step ? <Check className="size-3.5 text-primary" aria-hidden /> : <span aria-hidden>{i + 1}.</span>}
                    <span className="hidden sm:inline">{s.short}</span>
                    <span className="sr-only">
                      {`Step ${i + 1}: ${s.short}`}
                      {i === step ? " (current)" : done ? " (complete)" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) void nextStep();
          else submit();
        }}
        className="space-y-6 rounded-2xl border bg-card p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step + 1} of {STEPS.length}
              <span className="sr-only">: </span>
            </span>
            <span className="block">{STEPS[step].title}</span>
          </h2>
          <ReportTypeBadge type={reportType} />
        </div>

        {(summaryRows.length > 0 || serverError) && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm outline-none">
            <p className="flex items-center gap-2 font-semibold text-destructive">
              <TriangleAlert className="size-4" aria-hidden />
              {serverError ?? "Please fix the following before continuing:"}
            </p>
            {summaryRows.length > 0 && (
              <ul className="mt-2 space-y-1 pl-1">
                {summaryRows.map(({ name, message }) => {
                  const current = errors[name as keyof typeof errors]?.message as string | undefined;
                  const fixed = !current;
                  return (
                    <li key={name} className="flex items-start gap-1.5">
                      {fixed ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      ) : (
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden />
                      )}
                      <button
                        type="button"
                        className={cn("text-left underline-offset-2", fixed ? "text-muted-foreground" : "underline")}
                        onClick={() => setFocus(name)}
                      >
                        {FIELD_LABELS[name] ?? name}: {fixed ? "Fixed" : (current ?? message)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <Field
              id="title"
              label="Item name"
              hint={`A short name people would search for, e.g. “Black iPhone 14” or “Blue Hydro Flask”.`}
              error={errors.title?.message}
              required
            >
              {(props) => <Input {...props} {...register("title")} maxLength={120} autoComplete="off" />}
            </Field>

            <fieldset aria-describedby={errors.categoryId ? "category-error" : "category-hint"} className="space-y-2">
              <legend className="text-sm font-semibold">
                Category <span className="text-xs font-normal text-muted-foreground">(required)</span>
              </legend>
              <p id="category-hint" className="text-sm text-muted-foreground">
                Helps people filter to the right kind of item.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border bg-background px-3 py-2 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
                  >
                    <input type="radio" value={c.id} {...register("categoryId")} className="sr-only" />
                    <CategoryIcon icon={c.icon} className="size-4 shrink-0 text-primary" />
                    {c.name}
                  </label>
                ))}
              </div>
              {errors.categoryId && (
                <p id="category-error" className="text-sm font-medium text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </fieldset>

            <Field
              id="description"
              label="Description"
              hint={
                isLost
                  ? "What it looks like and anything that would help a finder recognise it. At least 10 characters."
                  : "What you found and its general condition. Don't describe every detail — keep some private for verification on the next steps."
              }
              error={errors.description?.message}
              required
            >
              {(props) => <Textarea {...props} {...register("description")} rows={5} maxLength={2000} />}
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Field
              id="eventDate"
              label={isLost ? "Date you lost it" : "Date you found it"}
              hint="Your best guess is fine. It's used for date filters."
              error={errors.eventDate?.message}
              required
            >
              {(props) => <Input {...props} type="date" max={today()} {...register("eventDate")} className="sm:max-w-xs" />}
            </Field>
            <Field
              id="generalLocation"
              label="General location"
              hint="A building or area, not an exact spot or your home address. Pick a suggestion or type your own."
              error={errors.generalLocation?.message}
              required
            >
              {(props) => (
                <>
                  <Input {...props} {...register("generalLocation")} list="campus-locations" maxLength={120} autoComplete="off" />
                  <datalist id="campus-locations">
                    {CAMPUS_LOCATIONS.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Photos <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {isLost
                  ? "A photo of the item (or a similar one) helps finders recognise it."
                  : "Show the item clearly, but avoid showing card numbers, names or what's inside."}
              </p>
              <PhotoUploader photos={photos} onChange={setPhotos} onBusyChange={setUploading} />
            </div>

            <Field
              id="distinguishingFeatures"
              label="Distinguishing features"
              hint="Publicly visible details: colour, brand, stickers, case. Don't include phone numbers or emails."
              error={errors.distinguishingFeatures?.message}
            >
              {(props) => <Textarea {...props} {...register("distinguishingFeatures")} rows={2} maxLength={500} />}
            </Field>

            {!isLost && (
              <Field
                id="verificationDetails"
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="size-3.5" aria-hidden /> Private verification details
                  </span>
                }
                hint="Only you will see this. Note a detail only the real owner would know (contents, engraving, lock screen) and compare it with what claimants tell you."
                error={errors.verificationDetails?.message}
              >
                {(props) => <Textarea {...props} {...register("verificationDetails")} rows={2} maxLength={500} />}
              </Field>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                How should people reach you? <span className="text-xs font-normal text-muted-foreground">(required)</span>
              </legend>
              <p className="text-sm text-muted-foreground">Either way, your email and phone number stay private.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONTACT_PREFERENCES.map((pref) => (
                  <label
                    key={pref}
                    className="flex cursor-pointer gap-3 rounded-xl border bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
                  >
                    <input type="radio" value={pref} {...register("contactPreference")} className="mt-1 size-4 accent-[var(--primary)]" />
                    <span>
                      <span className="block text-sm font-semibold">{CONTACT_PREFERENCE_INFO[pref].label}</span>
                      <span className="block text-xs text-muted-foreground">{CONTACT_PREFERENCE_INFO[pref].description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check everything looks right. You can edit your report later from your dashboard.
            </p>
            <dl className="divide-y rounded-xl border">
              <ReviewRow label="Item name" value={values.title} onEdit={() => goTo(0)} />
              <ReviewRow label="Category" value={category?.name ?? "—"} onEdit={() => goTo(0)} />
              <ReviewRow label="Description" value={values.description} onEdit={() => goTo(0)} />
              <ReviewRow label={isLost ? "Date lost" : "Date found"} value={values.eventDate ? formatDate(values.eventDate) : "—"} onEdit={() => goTo(1)} />
              <ReviewRow label="Location" value={values.generalLocation} onEdit={() => goTo(1)} />
              <ReviewRow label="Photos" value={photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""}` : "None"} onEdit={() => goTo(2)} />
              <ReviewRow label="Distinguishing features" value={values.distinguishingFeatures || "None"} onEdit={() => goTo(2)} />
              {!isLost && (
                <ReviewRow label="Private details (only you)" value={values.verificationDetails || "None — consider adding one"} onEdit={() => goTo(2)} />
              )}
              <ReviewRow
                label="Contact"
                value={CONTACT_PREFERENCE_INFO[values.contactPreference ?? "IN_APP"].label}
                onEdit={() => goTo(2)}
              />
            </dl>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" size="lg" onClick={() => goTo(step - 1)} disabled={pending}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          ) : (
            <Button asChild variant="ghost" size="lg">
              <Link href={mode === "edit" && itemId ? `/items/${itemId}` : "/"}>Cancel</Link>
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="submit" size="lg" disabled={uploading}>
              {uploading ? "Waiting for photos…" : "Continue"} <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={pending || uploading}>
              {pending ? "Saving…" : mode === "create" ? `Submit ${isLost ? "lost" : "found"} report` : "Save changes"}
              {!pending && <Check aria-hidden />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string | undefined; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-4 p-3.5">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-sm break-words whitespace-pre-line">{value || "—"}</dd>
      <Button type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Pencil aria-hidden /> Edit
      </Button>
    </div>
  );
}

/** Closure: confirm success and explain what happens next (Shneiderman #4). */
function SubmissionConfirmation({ id, isLost }: { id: string; isLost: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8" role="status">
      <CircleCheck className="size-12 text-success" aria-hidden />
      <h2 ref={ref} tabIndex={-1} className="mt-4 text-2xl font-semibold outline-none">
        Your {isLost ? "lost" : "found"} report is live
      </h2>
      <p className="mt-2 text-muted-foreground">Thank you. Here&apos;s what happens next:</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li>Your report now appears in search results and on the home page.</li>
        <li>
          {isLost
            ? "If someone finds a match, they'll send you a private message."
            : "When someone claims it, you'll see their request and their answer to your private detail."}{" "}
          Updates appear on your dashboard.
        </li>
        <li>When the item is back home, mark the report as reunited.</li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/items/${id}`}>View my report</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/browse?type=${isLost ? "FOUND" : "LOST"}`}>
            {isLost ? "Browse found items" : "Browse lost items"}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
