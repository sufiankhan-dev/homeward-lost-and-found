import { Skeleton } from "@/components/ui/skeleton";

export default function ItemLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" role="status" aria-label="Loading listing">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-2/3" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
