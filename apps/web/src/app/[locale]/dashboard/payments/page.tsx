import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionCard } from "@/components/payments/subscription-card";
import { formatPrice } from "@/lib/utils";

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const session = await getSession();
  const role = (session?.user?.role as string) ?? "BUYER";

  if (role === "BUYER") {
    return <p className="text-muted-foreground">—</p>;
  }

  const [payments, subscription] = await Promise.all([
    api.payments.history(),
    api.payments.mySubscription(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("payments")}</h1>

      <SubscriptionCard
        subscription={
          subscription
            ? {
                status: subscription.status,
                plan: subscription.plan,
                currentPeriodEnd: subscription.currentPeriodEnd,
              }
            : null
        }
      />

      <h2 className="pt-2 text-lg font-semibold">History</h2>
      {payments.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{p.listing?.title ?? p.kind}</p>
                  <p className="text-sm text-muted-foreground">{p.kind}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatPrice(p.amount, p.currency, locale)}</span>
                  <Badge variant={p.status === "PAID" ? "success" : "default"}>{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
