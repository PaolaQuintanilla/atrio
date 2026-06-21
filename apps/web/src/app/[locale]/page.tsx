import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building, Building2, Car, Home, MapPin, TreePine, Search, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/orpc/server";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { localized } from "@/lib/utils";

const ICONS: Record<string, typeof Home> = {
  "building-2": Building2,
  building: Building,
  home: Home,
  trees: TreePine,
  car: Car,
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [categories, recent] = await Promise.all([
    api.categories.tree(),
    api.search.listings({ page: 1, pageSize: 8 }),
  ]);
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-[var(--color-secondary-foreground)] text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/90">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search">
              <Button size="lg" variant="accent">
                <Search className="size-4" />
                {t("ctaBrowse")}
              </Button>
            </Link>
            <Link href="/dashboard/listings/new">
              <Button size="lg" variant="secondary">
                <Plus className="size-4" />
                {t("ctaSell")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">{t("categories")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {topLevel.flatMap((parent) => {
            const children = categories.filter((c) => c.parentId === parent.id);
            const items = children.length ? children : [parent];
            return items.map((cat) => {
              const Icon = ICONS[cat.icon ?? ""] ?? MapPin;
              return (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-card p-5 text-center transition hover:border-primary hover:shadow-sm"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-sm font-medium">{localized(cat.name, locale)}</span>
                </Link>
              );
            });
          })}
        </div>
      </section>

      {/* Recent listings */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-6 text-2xl font-bold">{t("featured")}</h2>
        {recent.items.length === 0 ? (
          <p className="text-muted-foreground">No listings yet — be the first to post one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
