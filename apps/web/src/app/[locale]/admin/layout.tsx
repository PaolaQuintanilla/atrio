import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { redirect, Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session?.user) redirect({ href: "/sign-in", locale });
  if (session!.user.role !== "ADMIN") redirect({ href: "/", locale });

  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <nav className="flex gap-2 text-sm">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            {t("verificationQueue")}
          </Link>
          <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
            {t("users")}
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
