"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Gavel } from "lucide-react";
import { Field, nativeSelectClass } from "@/components/form/field";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { moderateListing } from "@/lib/admin/actions";
import { MODERATION_ACTION_LABEL, type ModerationAction } from "@/lib/constants";

export function ModerateDialog({
  itemId,
  title,
  hidden,
  hasFlags,
}: {
  itemId: string;
  title: string;
  hidden: boolean;
  hasFlags: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const actions: ModerationAction[] = [
    hidden ? "RESTORE" : "HIDE",
    "MARK_DUPLICATE",
    "CLOSE",
    ...(hasFlags ? (["DISMISS_FLAGS"] as const) : []),
  ];
  const [action, setAction] = useState<ModerationAction>(actions[0]);
  const [reason, setReason] = useState("");
  const [duplicateOfId, setDuplicateOfId] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await moderateListing({
        itemReportId: itemId,
        action,
        reason,
        duplicateOfId: action === "MARK_DUPLICATE" ? duplicateOfId.trim() || undefined : undefined,
      });
      if (!result.ok) {
        setErrors({
          reason: result.fieldErrors?.reason?.[0],
          duplicateOfId: result.fieldErrors?.duplicateOfId?.[0],
          form: result.fieldErrors ? undefined : result.error,
        });
        return;
      }
      setOpen(false);
      setReason("");
      toast.success(`${MODERATION_ACTION_LABEL[action]}: “${title}”`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Gavel aria-hidden /> Moderate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>Moderate “{title}”</DialogTitle>
            <DialogDescription>The reporter will see the action and your reason in their activity feed.</DialogDescription>
          </DialogHeader>
          {errors.form && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.form}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="mod-action" className="text-sm font-semibold">
              Action
            </label>
            <select id="mod-action" value={action} onChange={(e) => setAction(e.target.value as ModerationAction)} className={nativeSelectClass}>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a === "HIDE" ? "Hide from public" : a === "RESTORE" ? "Restore to public" : a === "MARK_DUPLICATE" ? "Mark as duplicate (closes it)" : a === "CLOSE" ? "Close listing" : "Dismiss flags (no problem found)"}
                </option>
              ))}
            </select>
          </div>
          {action === "MARK_DUPLICATE" && (
            <Field id="mod-dup" label="Original listing ID" hint="Copy the ID from the original listing's address (/items/…)." error={errors.duplicateOfId} required>
              {(props) => <Input {...props} value={duplicateOfId} onChange={(e) => setDuplicateOfId(e.target.value)} />}
            </Field>
          )}
          <Field id="mod-reason" label="Reason" hint="Shown to the reporter. Be specific and polite." error={errors.reason} required>
            {(props) => <Textarea {...props} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Applying…" : "Apply action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
