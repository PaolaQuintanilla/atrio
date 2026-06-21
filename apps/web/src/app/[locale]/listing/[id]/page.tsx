import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, Clock, MapPin, ShieldAlert } from "lucide-react";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Gallery } from "@/components/listing/gallery";
import { AttributeList } from "@/components/listing/attribute-list";
import { ContactSeller } from "@/components/listing/contact-seller";
import { FavoriteButton } from "@/components/favorite-button";
import { formatPrice, localized } from "@/lib/utils";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listing");

  const listing = await api.listings.get({ id }).catch(() => null);
  if (!listing) notFound();

  const session = await getSession();
  const isAuthed = !!session?.user;
  const isOwner = session?.user?.id === listing.sellerId;

  const verifBadge = {
    VERIFIED: { variant: "success" as const, icon: BadgeCheck, label: t("verified") },
    PENDING: { variant: "default" as const, icon: Clock, label: t("pending") },
    REJECTED: { variant: "destructive" as const, icon: ShieldAlert, label: t("rejected") },
    UNVERIFIED: { variant: "outline" as const, icon: ShieldAlert, label: t("unverified") },
  }[listing.verificationStatus];

  const location = [listing.address, listing.city, listing.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Gallery images={listing.media} title={listing.title} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={listing.type === "RENT" ? "primary" : "accent"}>
              {listing.type === "RENT" ? t("perMonth").replace("/", "") : t("type")}
            </Badge>
            {verifBadge && (
              <Badge variant={verifBadge.variant}>
                <verifBadge.icon className="size-3" />
                {verifBadge.label}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {localized(listing.category.name, locale)}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{listing.title}</h1>
          {location && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              {location}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-4 font-semibold">{t("details")}</h2>
            <AttributeList
              definitions={listing.category.attributes}
              values={listing.attributes as Record<string, unknown>}
              locale={locale}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="prose max-w-none whitespace-pre-wrap pt-5 text-sm">
            {listing.description}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(listing.price, listing.currency, locale)}
                {listing.type === "RENT" && (
                  <span className="text-base font-normal text-muted-foreground">
                    {t("perMonth")}
                  </span>
                )}
              </span>
              <FavoriteButton listingId={listing.id} />
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
              {listing.seller.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.seller.image}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-semibold">
                  {listing.seller.name?.[0]?.toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium">{listing.seller.name}</span>
            </div>

            {!isOwner && <ContactSeller listingId={listing.id} isAuthed={isAuthed} />}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
