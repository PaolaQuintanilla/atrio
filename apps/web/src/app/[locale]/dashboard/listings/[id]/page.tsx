import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingForm } from "@/components/listing/listing-form";
import { MediaUploader } from "@/components/listing/media-uploader";
import { DocumentUploader } from "@/components/listing/document-uploader";
import { ListingActions } from "@/components/listing/listing-actions";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listing");

  const session = await getSession();
  if (!session?.user) redirect({ href: "/sign-in", locale });

  const listing = await api.listings.get({ id }).catch(() => null);
  if (!listing) notFound();

  const isOwner = listing.sellerId === session!.user.id || session!.user.role === "ADMIN";
  if (!isOwner) notFound();

  const [categories, documents] = await Promise.all([
    api.categories.tree(),
    api.documents.list({ listingId: id }).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={listing.status === "ACTIVE" ? "success" : "default"}>
            {listing.status}
          </Badge>
          <Badge variant={listing.verificationStatus === "VERIFIED" ? "primary" : "outline"}>
            {listing.verificationStatus}
          </Badge>
        </div>
      </div>

      <ListingActions
        listingId={listing.id}
        status={listing.status}
        isFeatured={listing.isFeatured}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("photos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaUploader
            listingId={listing.id}
            initial={listing.media.map((m) => ({ id: m.id, url: m.url, isCover: m.isCover }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            listingId={listing.id}
            initial={documents.map((d) => ({
              id: d.id,
              fileName: d.fileName,
              type: d.type,
              verificationStatus: d.verificationStatus,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingForm
            categories={categories}
            locale={locale}
            initial={{
              id: listing.id,
              categoryId: listing.categoryId,
              type: listing.type,
              title: listing.title,
              description: listing.description,
              price: Number(listing.price),
              currency: listing.currency,
              city: listing.city,
              country: listing.country,
              address: listing.address,
              attributes: listing.attributes as Record<string, unknown>,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
