import { ShieldCheck } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">{description}</p>
        {children}
      </div>
      <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        Your email is never shown on listings or shared with other users.
      </p>
    </div>
  );
}
