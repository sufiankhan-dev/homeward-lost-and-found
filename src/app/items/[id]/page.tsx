import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, EyeOff, Info, Lock, MapPin, Tag, Clock, Inbox } from "lucide-react";
import { ClaimStatusBadge, ReportTypeBadge, StatusBadge } from "@/components/items/badges";
import { ClaimForm } from "@/components/items/claim-form";
import { FlagDialog } from "@/components/items/flag-dialog";
import { ItemThumbnail } from "@/components/items/item-thumbnail";
import { OwnerActions } from "@/components/items/owner-actions";
import { PageHeader } from "@/components/page-header";
import { UserContent } from "@/components/translate/user-content";
import { Button } from "@/components/ui/button";
import { CONTACT_PREFERENCE_INFO, ITEM_STATUS_INFO } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/format";
import { getItemForViewer, getViewerClaimForItem, hasViewerFlagged } from "@/lib/items/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(props: PageProps<"/items/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  if (!UUID.test(id)) return { title: "Item not found" };
  const item = await getItemForViewer(id, null);
  return item
    ? { title: `${item.reportType === "LOST" ? "Lost" : "Found"}: ${item.title}`, description: item.description.slice(0, 150) }
    : { title: "Item" };
}

export default async function ItemPage(props: PageProps<"/items/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const viewer = await getCurrentUser();
  const item = await getItemForViewer(id, viewer);
  if (!item) notFound();

  const isOwner = viewer?.id === item.userId;
  const isLost = item.reportType === "LOST";
  const acceptsRequests = item.status === "OPEN" || item.status === "PENDING";
  const [existingClaim, flagged] =
    viewer && !isOwner
      ? await Promise.all([getViewerClaimForItem(item.id, viewer.id), hasViewerFlagged(item.id, viewer.id)])
      : [null, false];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[
          { href: "/browse", label: "Browse" },
          { href: `/browse?type=${item.reportType}`, label: isLost ? "Lost items" : "Found items" },
        ]}
        title={<UserContent as="span">{item.title}</UserContent>}
      />

      {item.visibility === "HIDDEN" && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
          <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          A moderator has hidden this listing from the public. Only you and moderators can see it. Check your dashboard
          activity for the reason.
        </p>
      )}
      {item.duplicateOfId && (
        <p className="mb-6 flex items-start gap-2 rounded-xl border bg-muted p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            This listing was merged into another report.{" "}
            <Link href={`/items/${item.duplicateOfId}`} className="font-medium text-primary underline underline-offset-4">
              View the original listing
            </Link>
          </span>
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border">
              <ItemThumbnail
                size="full"
                imageId={item.images[0]?.id}
                alt={item.images[0]?.altText ?? ""}
                categoryIcon={item.categoryIcon}
                categoryName={item.categoryName}
              />
            </div>
            {item.images.length > 1 && (
              <ul className="grid grid-cols-3 gap-3">
                {item.images.slice(1).map((img) => (
                  <li key={img.id} className="overflow-hidden rounded-xl border">
                    <a href={`/api/images/${img.id}`} target="_blank" rel="noreferrer" aria-label="Open photo in full size">
                      <ItemThumbnail imageId={img.id} alt={img.altText ?? ""} categoryIcon={item.categoryIcon} categoryName={item.categoryName} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ReportTypeBadge type={item.reportType} />
            <StatusBadge status={item.status} withDescription />
          </div>

          <dl className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            <Detail icon={<Calendar />} label={isLost ? "Date lost" : "Date found"} value={formatDate(item.eventDate)} />
            <Detail icon={<MapPin />} label="General location" value={item.generalLocation} />
            <Detail
              icon={<Tag />}
              label="Category"
              value={
                <Link href={`/browse?category=${item.categorySlug}`} className="text-primary underline-offset-4 hover:underline">
                  {item.categoryName}
                </Link>
              }
            />
            <Detail icon={<Clock />} label="Reported" value={`${formatRelative(item.createdAt)} by ${item.reporterFirstName}`} />
          </dl>

          <section aria-labelledby="desc-heading" className="space-y-2">
            <h2 id="desc-heading" className="text-lg font-semibold">
              Description
            </h2>
            <UserContent className="leading-relaxed whitespace-pre-line">{item.description}</UserContent>
          </section>

          {item.distinguishingFeatures && (
            <section aria-labelledby="features-heading" className="space-y-2">
              <h2 id="features-heading" className="text-lg font-semibold">
                Distinguishing features
              </h2>
              <UserContent className="leading-relaxed whitespace-pre-line">{item.distinguishingFeatures}</UserContent>
            </section>
          )}

          {!isLost && !isOwner && (
            <p className="flex items-start gap-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              The finder has kept some identifying details private. When you claim this item you&apos;ll be asked to
              describe one, so only the real owner can get it back.
            </p>
          )}
        </div>

        {/* Action panel: the main action sits next to the content it acts on. */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Actions">
          {isOwner ? (
            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <div>
                <h2 className="font-semibold">This is your report</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ITEM_STATUS_INFO[item.status].description}</p>
              </div>
              {item.verificationDetails && (
                <div className="rounded-xl border border-dashed p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Lock className="size-3.5" aria-hidden /> Your private verification note
                  </p>
                  <p className="mt-1 text-muted-foreground">{item.verificationDetails}</p>
                </div>
              )}
              <Button asChild className="w-full">
                <Link href="/dashboard/requests">
                  <Inbox aria-hidden /> View requests about my reports
                </Link>
              </Button>
              <OwnerActions itemId={item.id} title={item.title} status={item.status} />
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <div>
                <h2 className="text-lg font-semibold">{isLost ? "Have you found this?" : "Is this yours?"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isLost
                    ? `Send ${item.reporterFirstName} a private message. Your contact details stay hidden.`
                    : `Send ${item.reporterFirstName} a private claim request. Your contact details stay hidden.`}
                </p>
              </div>
              {!acceptsRequests ? (
                <p className="rounded-xl bg-muted p-3 text-sm">
                  This listing is <strong>{ITEM_STATUS_INFO[item.status].label.toLowerCase()}</strong> and no longer accepts
                  requests.
                </p>
              ) : !viewer ? (
                <div className="space-y-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/sign-in?next=/items/${item.id}`}>Sign in to contact {item.reporterFirstName}</Link>
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New here?{" "}
                    <Link href={`/sign-up?next=/items/${item.id}`} className="font-medium text-primary underline underline-offset-4">
                      Create a free account
                    </Link>
                  </p>
                </div>
              ) : existingClaim && existingClaim.status !== "WITHDRAWN" ? (
                <div className="space-y-3 rounded-xl bg-muted p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    You&apos;ve already sent a request: <ClaimStatusBadge status={existingClaim.status} />
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/requests/${existingClaim.id}`}>Open conversation</Link>
                  </Button>
                </div>
              ) : (
                <ClaimForm itemId={item.id} reportType={item.reportType} reporterFirstName={item.reporterFirstName} />
              )}
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5 text-sm">
            <h2 className="font-semibold">Handover</h2>
            <p className="mt-1 text-muted-foreground">{CONTACT_PREFERENCE_INFO[item.contactPreference].label}</p>
            <p className="mt-2 text-muted-foreground">
              Meet somewhere busy on campus, check a private detail first, and never pay to get an item back.{" "}
              <Link href="/privacy" className="text-primary underline underline-offset-4">
                Safety tips
              </Link>
            </p>
          </div>

          {viewer && !isOwner && <FlagDialog itemId={item.id} alreadyFlagged={flagged} />}
        </aside>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div>
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
      </div>
    </div>
  );
}
