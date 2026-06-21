import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { ListingCard } from "@/components/listing-card";
import { SearchFilters, type CategoryOption } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localized } from "@/lib/utils";

type SP = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("search");

  const page = Number(str(sp.page) ?? "1") || 1;
  const result = await api.search.listings({
    q: str(sp.q),
    categorySlug: str(sp.category),
    type: str(sp.type) === "RENT" || str(sp.type) === "SALE" ? (str(sp.type) as "RENT" | "SALE") : undefined,
    minPrice: str(sp.minPrice) ? Number(sp.minPrice) : undefined,
    maxPrice: str(sp.maxPrice) ? Number(sp.maxPrice) : undefined,
    city: str(sp.city),
    verifiedOnly: str(sp.verifiedOnly) === "1",
    sort: (str(sp.sort) as "newest" | "price_asc" | "price_desc") ?? "newest",
    page,
    pageSize: 24,
  });

  const categories = await api.categories.tree();
  const options: CategoryOption[] = [];
  for (const top of categories.filter((c) => !c.parentId)) {
    options.push({ slug: top.slug, label: localized(top.name, locale), depth: 0 });
    for (const child of categories.filter((c) => c.parentId === top.id)) {
      options.push({ slug: child.slug, label: localized(child.name, locale), depth: 1 });
    }
  }

  const initial: Record<string, string> = {};
  for (const k of ["q", "category", "type", "minPrice", "maxPrice", "city", "sort"]) {
    const v = str(sp[k]);
    if (v) initial[k] = v;
  }
  if (str(sp.verifiedOnly) === "1") initial.verifiedOnly = "1";

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(initial)) params.set(k, v);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <SearchFilters categories={options} initial={initial} />
      </aside>

      <section>
        <p className="mb-4 text-sm text-muted-foreground">{t("results", { count: result.total })}</p>

        {result.items.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-[var(--color-border)] py-20 text-muted-foreground">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        )}

        {result.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)}>
                <Button variant="outline" size="sm">
                  ‹
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {page} / {result.pages}
            </span>
            {page < result.pages && (
              <Link href={pageHref(page + 1)}>
                <Button variant="outline" size="sm">
                  ›
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
