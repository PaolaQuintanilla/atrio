"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function ListingActions({
  listingId,
  status,
  isFeatured,
}: {
  listingId: string;
  status: string;
  isFeatured: boolean;
}) {
  const t = useTranslations("listing");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(next: "ACTIVE" | "DRAFT") {
    setPending(true);
    await client.listings.setStatus({ id: listingId, status: next });
    router.refresh();
    setPending(false);
  }

  async function feature() {
    setPending(true);
    try {
      const { url } = await client.payments.featureListing({ listingId });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this listing?")) return;
    setPending(true);
    await client.listings.delete({ id: listingId });
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <Button variant="outline" disabled={pending} onClick={() => setStatus("DRAFT")}>
          {t("unpublish")}
        </Button>
      ) : (
        <Button disabled={pending} onClick={() => setStatus("ACTIVE")}>
          {t("publish")}
        </Button>
      )}

      {!isFeatured && (
        <Button variant="accent" disabled={pending} onClick={feature}>
          <Sparkles className="size-4" />
          {td("feature")}
        </Button>
      )}

      <Button variant="ghost" disabled={pending} onClick={remove} className="text-destructive">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
