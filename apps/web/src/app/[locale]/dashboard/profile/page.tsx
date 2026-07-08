import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail } from "lucide-react";
import { api } from "@/lib/orpc/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");
  const { user, profile } = await api.profile.me();

  const avatar = profile?.avatarUrl ?? user.image ?? undefined;
  const displayName = profile?.displayName ?? user.name;
  const role = (user.role as string) ?? "BUYER";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Account summary */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <Avatar name={displayName} src={avatar} className="size-16 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{displayName}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user.email}
            </p>
          </div>
          <Badge variant={role === "ADMIN" ? "accent" : "primary"}>
            {t("role")}: {role}
          </Badge>
        </CardContent>
      </Card>

      {/* Editable personal info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              displayName: profile?.displayName,
              phone: profile?.phone,
              country: profile?.country,
              city: profile?.city,
              bio: profile?.bio,
              avatarUrl: profile?.avatarUrl,
              fallbackName: user.name,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
