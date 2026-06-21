import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/orpc/server";
import { getSession } from "@/lib/auth";
import { ListingForm } from "@/components/listing/listing-form";
import { BecomeSeller } from "@/components/listing/become-seller";

export default async function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listing");
  const session = await getSession();
  const role = (session?.user?.role as string) ?? "BUYER";

  if (role === "BUYER") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("createTitle")}</h1>
        <BecomeSeller />
      </div>
    );
  }

  const categories = await api.categories.tree();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("createTitle")}</h1>
      <ListingForm categories={categories} locale={locale} />
    </div>
  );
}
