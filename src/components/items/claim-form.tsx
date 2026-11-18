"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleCheck, Lock, Send } from "lucide-react";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/action-result";
import { createClaimRequest } from "@/lib/claims/actions";

/**
 * Safe contact: the message goes through Homeward, never to an email or
 * phone number. Found items require a private identifying detail so the
 * finder can verify ownership.
 */
export function ClaimForm({
  itemId,
  reportType,
  reporterFirstName,
}: {
  itemId: string;
  reportType: "LOST" | "FOUND";
  reporterFirstName: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isFound = reportType === "FOUND";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createClaimRequest({
        itemReportId: itemId,
        message,
        verificationAnswer: answer || undefined,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      setErrors({});
      setSentId(result.data.id);
      toast.success("Request sent privately.");
      router.refresh();
    });
  }

  if (sentId) {
    return (
      <div role="status" className="rounded-2xl border border-success/30 bg-success-soft p-5">
        <p className="flex items-center gap-2 font-semibold text-success">
          <CircleCheck className="size-5" aria-hidden /> Request sent to {reporterFirstName}
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          {reporterFirstName} will see your message on their dashboard. You&apos;ll get an update on yours when they reply —
          usually within a day or two.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/dashboard/requests/${sentId}`}>View your request</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <Field
        id="claim-message"
        label={isFound ? "Why do you think it's yours?" : "Where and when did you find it?"}
        hint={
          isFound
            ? "Say when and where you lost it. Don't include your phone number — you can share contact details later if you choose."
            : "Describe what you found so the owner can tell if it's theirs."
        }
        error={errors.message?.[0]}
        required
      >
        {(props) => (
          <Textarea
            {...props}
            rows={4}
            value={message}
            maxLength={1000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isFound ? "I lost it on Tuesday afternoon near…" : "I found something similar outside…"}
          />
        )}
      </Field>
      {isFound && (
        <Field
          id="claim-answer"
          label={
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" aria-hidden /> A detail only the owner would know
            </span>
          }
          hint="For example, what's inside, a scratch, a sticker or the lock-screen picture. Only the finder sees this."
          error={errors.verificationAnswer?.[0]}
          required
        >
          {(props) => (
            <Textarea {...props} rows={2} value={answer} maxLength={500} onChange={(e) => setAnswer(e.target.value)} />
          )}
        </Field>
      )}
      <p className="text-xs text-muted-foreground">{message.trim().length}/1000 characters · at least 20</p>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <Send aria-hidden />
        {pending ? "Sending…" : isFound ? "Send claim request" : "Send message to owner"}
      </Button>
    </form>
  );
}
