import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { ListingCard } from "@/components/listing-card";

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const session = await getSession();
  if (!session?.user) redirect({ href: "/sign-in", locale });

  const listings = await api.listings.favorites();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("favorites")}</h1>
      {listings.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} favorited />
          ))}
        </div>
      )}
    </div>
  );
}
