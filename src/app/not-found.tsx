import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="text-sm font-semibold text-primary">Page not found</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted-foreground">
        The link may be out of date, or the listing may have been removed by its reporter.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/browse">Browse items</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go to home page</Link>
        </Button>
      </div>
    </div>
  );
}
