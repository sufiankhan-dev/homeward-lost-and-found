import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/format";
import type { PublicItem } from "@/lib/items/queries";
import { ReportTypeBadge, StatusBadge } from "./badges";
import { ItemThumbnail } from "./item-thumbnail";

/**
 * Listing card. The whole card is one large link target (Fitts's law) and
 * always shows the same fields in the same order (consistency, recognition).
 */
export function ItemCard({ item, headingLevel = "h3" }: { item: PublicItem; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const image = item.images[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow focus-within:ring-3 focus-within:ring-ring/50 hover:shadow-md">
      <ItemThumbnail
        imageId={image?.id}
        alt={image?.altText ?? ""}
        categoryIcon={item.categoryIcon}
        categoryName={item.categoryName}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ReportTypeBadge type={item.reportType} />
          {item.status !== "OPEN" && <StatusBadge status={item.status} />}
        </div>
        <Heading className="text-base leading-snug font-semibold">
          <Link
            href={`/items/${item.id}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            <span translate="no" className="notranslate sr-only">
              {item.reportType === "LOST" ? "Lost: " : "Found: "}
            </span>
            {item.title}
          </Link>
        </Heading>
        <dl className="mt-auto space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt>
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Location</span>
            </dt>
            <dd className="truncate">{item.generalLocation}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <Calendar className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">{item.reportType === "LOST" ? "Date lost" : "Date found"}</span>
            </dt>
            <dd>
              {item.reportType === "LOST" ? "Lost" : "Found"} {formatDate(item.eventDate)}
              <span aria-hidden> · </span>
              <span className="sr-only">, reported </span>
              <span className="text-xs">reported {formatRelative(item.createdAt)}</span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
