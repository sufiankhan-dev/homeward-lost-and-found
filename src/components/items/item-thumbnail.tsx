import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

/**
 * Consistent 4:3 image area with a category-icon fallback when there is no
 * photo, so every card keeps the same shape.
 */
export function ItemThumbnail({
  imageId,
  alt,
  categoryIcon,
  categoryName,
  className,
  size = "thumb",
}: {
  imageId?: string;
  alt: string;
  categoryIcon: string;
  categoryName: string;
  className?: string;
  size?: "thumb" | "full";
}) {
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden bg-muted", className)}>
      {imageId ? (
        // Images are already resized and re-encoded server-side.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/images/${imageId}${size === "thumb" ? "?size=thumb" : ""}`}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <CategoryIcon icon={categoryIcon} className="size-10 opacity-70" strokeWidth={1.5} />
          <span className="text-xs">No photo · {categoryName}</span>
        </div>
      )}
    </div>
  );
}
