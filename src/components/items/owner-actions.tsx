"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Archive, CircleCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import { ITEM_STATUS_INFO, type ItemStatus } from "@/lib/constants";
import { changeReportStatus, deleteReport } from "@/lib/items/actions";
import { cn } from "@/lib/utils";

/**
 * Owner controls. Status changes take effect immediately and offer Undo
 * (easy reversal); deleting is permanent so it asks for confirmation
 * (error prevention).
 */
export function OwnerActions({
  itemId,
  title,
  status,
  layout = "stack",
  afterDeleteHref = "/dashboard",
}: {
  itemId: string;
  title: string;
  status: ItemStatus;
  layout?: "stack" | "row";
  afterDeleteHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: ItemStatus, successMessage: string) {
    startTransition(async () => {
      const result = await changeReportStatus({ itemReportId: itemId, status: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const previous = result.data.previousStatus;
      router.refresh();
      toast.success(successMessage, {
        description: `Status: ${ITEM_STATUS_INFO[next].label}`,
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              const undo = await changeReportStatus({ itemReportId: itemId, status: previous });
              if (undo.ok) {
                toast.success(`Restored to “${ITEM_STATUS_INFO[previous].label}”.`);
                router.refresh();
              } else {
                toast.error(undo.error);
              }
            }),
        },
      });
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteReport(itemId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`“${title}” was deleted.`);
      router.push(afterDeleteHref);
      router.refresh();
    });
  }

  const isActive = status === "OPEN" || status === "PENDING";

  return (
    <div className={cn("flex gap-2", layout === "stack" ? "flex-col" : "flex-wrap")} aria-busy={pending}>
      <Button asChild variant="outline" className={layout === "stack" ? "justify-start" : undefined}>
        <Link href={`/items/${itemId}/edit`}>
          <Pencil aria-hidden /> Edit report
        </Link>
      </Button>
      {isActive && (
        <Button
          variant="outline"
          disabled={pending}
          className={cn("text-success", layout === "stack" && "justify-start")}
          onClick={() => setStatus("RESOLVED", "Wonderful — marked as reunited!")}
        >
          <CircleCheck aria-hidden /> Mark as reunited
        </Button>
      )}
      {isActive ? (
        <Button
          variant="outline"
          disabled={pending}
          className={layout === "stack" ? "justify-start" : undefined}
          onClick={() => setStatus("CLOSED", "Report closed. It no longer accepts requests.")}
        >
          <Archive aria-hidden /> Close report
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={pending}
          className={layout === "stack" ? "justify-start" : undefined}
          onClick={() => setStatus("OPEN", "Report reopened.")}
        >
          <RotateCcw aria-hidden /> Reopen report
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={pending} className={layout === "stack" ? "justify-start" : undefined}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the report, its photos and any requests about it. This can&apos;t be undone.
              If you just want to stop receiving requests, close the report instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep report</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
