import { getTranslations } from "next-intl/server";
import { Building2, Heart, LayoutDashboard, MessageSquare, Plus, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./user-menu";

export async function Navbar() {
  const t = await getTranslations("nav");
  const session = await getSession();
  const user = session?.user;
  const role = (user?.role as string) ?? "BUYER";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Building2 className="size-6" />
          <span className="text-lg">Atria</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link href="/search">
            <Button variant="ghost" size="sm">
              {t("browse")}
            </Button>
          </Link>
          {user && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="size-4" />
                {t("dashboard")}
              </Button>
            </Link>
          )}
          {role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="size-4" />
                {t("admin")}
              </Button>
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {user && (
            <>
              <Link href="/messages" className="hidden sm:block">
                <Button variant="ghost" size="icon" aria-label={t("messages")}>
                  <MessageSquare />
                </Button>
              </Link>
              <Link href="/favorites" className="hidden sm:block">
                <Button variant="ghost" size="icon" aria-label={t("favorites")}>
                  <Heart />
                </Button>
              </Link>
            </>
          )}
          <LocaleSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              <Link href="/dashboard/listings/new" className="hidden sm:block">
                <Button size="sm" variant="accent">
                  <Plus className="size-4" />
                  {t("sell")}
                </Button>
              </Link>
              <SignOutButton label={t("signOut")} />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">{t("signUp")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
