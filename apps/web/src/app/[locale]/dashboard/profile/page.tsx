import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const { profile } = await api.profile.me();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("profile")}</h1>
      <ProfileForm
        initial={{
          displayName: profile?.displayName,
          phone: profile?.phone,
          country: profile?.country,
          city: profile?.city,
          bio: profile?.bio,
        }}
      />
    </div>
  );
}
