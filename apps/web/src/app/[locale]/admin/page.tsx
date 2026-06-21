import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { localized } from "@/lib/utils";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const [stats, queue] = await Promise.all([api.admin.stats(), api.verification.queue()]);

  const cards = [
    { label: t("totalUsers"), value: stats.users },
    { label: t("totalListings"), value: stats.listings },
    { label: t("pending"), value: stats.pendingVerification },
    { label: t("verified"), value: stats.verified },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-bold text-primary">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("verificationQueue")}</h2>
        {queue.length === 0 ? (
          <p className="text-muted-foreground">—</p>
        ) : (
          <div className="space-y-2">
            {queue.map((l) => (
              <Link key={l.id} href={`/admin/verify/${l.id}`}>
                <Card className="transition hover:shadow-sm">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {localized(l.category.name, locale)} · {l.seller.name} ·{" "}
                        {l.documents.length} docs
                      </p>
                    </div>
                    <span className="text-sm text-primary">→</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
