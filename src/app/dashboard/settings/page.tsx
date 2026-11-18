import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/dashboard/settings-forms";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profile settings" };

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile settings</h1>
        <p className="mt-1 text-muted-foreground">Manage how you appear and how you sign in.</p>
      </div>
      <section aria-labelledby="profile-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 id="profile-heading" className="mb-5 text-lg font-semibold">
          Profile
        </h2>
        <ProfileForm initialName={user.name} email={user.email} />
      </section>
      <section aria-labelledby="password-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 id="password-heading" className="mb-5 text-lg font-semibold">
          Password
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
