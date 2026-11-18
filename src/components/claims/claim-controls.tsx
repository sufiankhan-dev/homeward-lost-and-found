"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { respondToClaim, sendClaimMessage, withdrawClaim } from "@/lib/claims/actions";

export function ClaimDecision({ claimId, requesterName }: { claimId: string; requesterName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(decision: "ACCEPTED" | "DECLINED") {
    startTransition(async () => {
      const result = await respondToClaim({ claimRequestId: claimId, decision });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        decision === "ACCEPTED"
          ? `Accepted. ${requesterName} can now message you to arrange a handover.`
          : `Declined. ${requesterName} has been told.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => decide("ACCEPTED")} disabled={pending} className="bg-success hover:bg-success/90">
        <Check aria-hidden /> Accept and start conversation
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={pending}>
            <X aria-hidden /> Decline
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {requesterName} will be told it isn&apos;t a match, and this conversation will close. Your report stays open
              for other people.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => decide("DECLINED")}>Decline request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function WithdrawButton({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending}>
          Withdraw request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw your request?</AlertDialogTitle>
          <AlertDialogDescription>
            Use this if you realise the item isn&apos;t yours. You can send a new request later if you change your mind.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep request</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await withdrawClaim(claimId);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Request withdrawn.");
                  router.refresh();
                }
              })
            }
          >
            Withdraw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MessageComposer({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Write a message first.");
      return;
    }
    startTransition(async () => {
      const result = await sendClaimMessage({ claimRequestId: claimId, body });
      if (!result.ok) {
        setError(result.fieldErrors?.body?.[0] ?? result.error);
        return;
      }
      setBody("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <form onSubmit={send} noValidate className="space-y-2">
      <label htmlFor="message-body" className="text-sm font-semibold">
        Reply
      </label>
      <Textarea
        id="message-body"
        rows={3}
        value={body}
        maxLength={1000}
        aria-invalid={error ? true : undefined}
        aria-describedby="message-hint"
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Suggest a time and a busy public place, or the Lost & Found desk…"
      />
      <p id="message-hint" className="text-xs text-muted-foreground">
        Only you and the other person can read this. Share contact details only if you&apos;re comfortable.
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        <Send aria-hidden /> {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
