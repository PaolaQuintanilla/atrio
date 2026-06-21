import { setRequestLocale, getTranslations } from "next-intl/server";
import { Heart, LayoutDashboard, MessageSquare, Plus, Receipt, User } from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
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

  const t = await getTranslations("nav");
  const td = await getTranslations("dashboard");

  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: td("title") },
    { href: "/dashboard/listings/new", icon: Plus, label: td("newListing") },
    { href: "/messages", icon: MessageSquare, label: t("messages") },
    { href: "/favorites", icon: Heart, label: t("favorites") },
    { href: "/dashboard/payments", icon: Receipt, label: td("payments") },
    { href: "/dashboard/profile", icon: User, label: t("profile") },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <it.icon className="size-4" />
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
