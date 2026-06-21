import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eye, Plus } from "lucide-react";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BecomeSeller } from "@/components/listing/become-seller";
import { formatPrice } from "@/lib/utils";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tl = await getTranslations("listing");
  const session = await getSession();
  const role = (session?.user?.role as string) ?? "BUYER";

  if (role === "BUYER") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <BecomeSeller />
      </div>
    );
  }

  const listings = await api.listings.mine();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("myListings")}</h1>
        <Link href="/dashboard/listings/new">
          <Button>
            <Plus className="size-4" />
            {t("newListing")}
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("newListing")} →
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <Link key={l.id} href={`/dashboard/listings/${l.id}`}>
              <Card className="transition hover:shadow-sm">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {l.media[0]?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.media[0].url} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="text-sm text-primary">{formatPrice(l.price, l.currency, locale)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="size-4" />
                      {l.viewCount}
                    </span>
                    <Badge variant={l.status === "ACTIVE" ? "success" : "default"}>{l.status}</Badge>
                    {l.verificationStatus === "VERIFIED" && (
                      <Badge variant="primary">{tl("verified")}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
