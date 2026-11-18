import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ReportForm } from "@/components/report/report-form";
import { getCategories, getItemForEdit } from "@/lib/items/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Edit report" };
export const dynamic = "force-dynamic";

export default async function EditItemPage(props: PageProps<"/items/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireUser(`/items/${id}/edit`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Ownership is enforced here and again in the update action.
  const [item, categories] = await Promise.all([getItemForEdit(id, user), getCategories()]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: `/items/${item.id}`, label: item.title },
        ]}
        title="Edit report"
        description="Jump to any step using the progress bar. Changes are saved when you select Save changes."
      />
      <ReportForm
        mode="edit"
        itemId={item.id}
        reportType={item.reportType}
        categories={categories}
        initialValues={{
          title: item.title,
          categoryId: item.categoryId,
          description: item.description,
          eventDate: item.eventDate,
          generalLocation: item.generalLocation,
          distinguishingFeatures: item.distinguishingFeatures ?? "",
          verificationDetails: item.verificationDetails ?? "",
          contactPreference: item.contactPreference,
          imageIds: item.images.map((img) => img.id),
        }}
        initialPhotos={item.images.map((img) => ({ id: img.id, previewUrl: `/api/images/${img.id}?size=thumb` }))}
      />
    </div>
  );
}
