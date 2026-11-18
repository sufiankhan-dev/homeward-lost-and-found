"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_REASON_LABEL, FLAG_REASONS, type FlagReason } from "@/lib/constants";
import { flagListing } from "@/lib/items/actions";

export function FlagDialog({ itemId, alreadyFlagged }: { itemId: string; alreadyFlagged: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FlagReason | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyFlagged);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flag className="size-4" aria-hidden /> You reported this listing. Moderators will review it.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    startTransition(async () => {
      const result = await flagListing({ itemReportId: itemId, reason, details: details || undefined });
      if (!result.ok) {
        setError(result.fieldErrors?.reason?.[0] ?? result.error);
        return;
      }
      setOpen(false);
      setDone(true);
      toast.success("Thanks — a moderator will review this listing.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag aria-hidden /> Report listing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
            <DialogDescription>Tell moderators what&apos;s wrong. The person who posted it won&apos;t see who reported it.</DialogDescription>
          </DialogHeader>
          <fieldset className="mt-4 space-y-2">
            <legend className="mb-2 text-sm font-semibold">Reason (required)</legend>
            {FLAG_REASONS.map((r) => (
              <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 has-[:checked]:border-primary has-[:checked]:bg-accent">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => {
                    setReason(r);
                    setError(null);
                  }}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm">{FLAG_REASON_LABEL[r]}</span>
              </label>
            ))}
          </fieldset>
          <label htmlFor="flag-details" className="mt-4 block text-sm font-semibold">
            More details <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea id="flag-details" className="mt-2" rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
