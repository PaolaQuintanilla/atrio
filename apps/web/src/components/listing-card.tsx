import { ImageIcon, MapPin, BadgeCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";
import { cn, formatPrice, localized, type Numeric } from "@/lib/utils";

export type ListingCardData = {
  id: string;
  title: string;
  price: Numeric;
  currency: string;
  type: "RENT" | "SALE";
  city?: string | null;
  country?: string | null;
  verificationStatus: string;
  isFeatured?: boolean;
  media?: { url: string }[];
  category?: { slug: string; name: unknown } | null;
};

export async function ListingCard({
  listing,
  locale,
  favorited,
}: {
  listing: ListingCardData;
  locale: string;
  favorited?: boolean;
}) {
  const t = await getTranslations("listing");
  const cover = listing.media?.[0]?.url;
  const verified = listing.verificationStatus === "VERIFIED";
  const location = [listing.city, listing.country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="size-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant={listing.type === "RENT" ? "primary" : "accent"}>
            {listing.type === "RENT" ? t("perMonth").replace("/", "") || "Rent" : t("type")}
          </Badge>
          {listing.isFeatured && <Badge variant="default">★</Badge>}
        </div>

        <div className="absolute right-2 top-2">
          <FavoriteButton listingId={listing.id} initial={favorited} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(listing.price, listing.currency, locale)}
            {listing.type === "RENT" && (
              <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
            )}
          </span>
          {verified && (
            <Badge variant="success" className={cn("shrink-0")}>
              <BadgeCheck className="size-3" />
              {t("verified")}
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
        {listing.category && (
          <p className="text-xs text-muted-foreground">
            {localized(listing.category.name, locale)}
          </p>
        )}
        {location && (
          <p className="mt-auto flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {location}
          </p>
        )}
      </div>
    </Link>
  );
}
