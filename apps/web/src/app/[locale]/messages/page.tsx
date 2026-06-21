import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { redirect, Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const session = await getSession();
  if (!session?.user) redirect({ href: "/sign-in", locale });

  const conversations = await api.messaging.conversations();
  const myId = session!.user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("messages")}</h1>
      {conversations.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const other = c.buyer.id === myId ? c.seller : c.buyer;
            const last = c.messages[0];
            return (
              <Link key={c.id} href={`/messages/${c.id}`}>
                <Card className="transition hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-semibold">
                      {other.name?.[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{other.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.listing.title} · {last?.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
