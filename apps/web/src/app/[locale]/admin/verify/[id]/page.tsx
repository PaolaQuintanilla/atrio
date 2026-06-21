import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, ExternalLink } from "lucide-react";
import { api } from "@/lib/orpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyActions } from "@/components/admin/verify-actions";
import { formatPrice } from "@/lib/utils";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listing");
  const ta = await getTranslations("admin");

  const listing = await api.verification.review({ listingId: id }).catch(() => null);
  if (!listing) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">{listing.title}</h2>
          <p className="text-primary">{formatPrice(listing.price, listing.currency, locale)}</p>
          <p className="text-sm text-muted-foreground">
            {listing.seller.name} · {listing.seller.email}
          </p>
        </div>
        <Card>
          <CardContent className="whitespace-pre-wrap pt-5 text-sm">
            {listing.description}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("documents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {listing.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              listing.documents.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:border-primary"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {d.type.replace(/_/g, " ")} — {d.fileName}
                  </span>
                  <ExternalLink className="size-4 text-primary" />
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>{ta("verificationQueue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <VerifyActions listingId={listing.id} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
