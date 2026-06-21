"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function VerifyActions({ listingId }: { listingId: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setPending(true);
    try {
      await client.verification.decide({ listingId, decision, notes: notes || undefined });
      toast.success("✓");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={t("reviewNotes")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <Button disabled={pending} onClick={() => decide("APPROVED")}>
          <Check className="size-4" />
          {t("approve")}
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => decide("REJECTED")}>
          <X className="size-4" />
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}
