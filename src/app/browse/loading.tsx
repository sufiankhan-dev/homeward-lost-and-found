import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" role="status" aria-label="Loading listings">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-6 h-11 w-full rounded-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading listings…</span>
    </div>
  );
}
