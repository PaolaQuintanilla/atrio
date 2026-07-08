"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Sub = { status: string; plan: string | null; currentPeriodEnd: Date | string | null } | null;

export function SubscriptionCard({ subscription }: { subscription: Sub }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const active = subscription?.status === "active" || subscription?.status === "trialing";

  async function subscribe() {
    setPending(true);
    try {
      const { url } = await client.payments.subscribe();
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setPending(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancel at the end of the current period?")) return;
    setPending(true);
    try {
      await client.payments.cancelSubscription();
      toast.success("✓");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Atria Pro — seller plan</p>
            <p className="text-sm text-muted-foreground">
              Priority placement and unlimited listings · $29/month
            </p>
            {active && subscription?.currentPeriodEnd && (
              <p className="mt-1 text-xs text-muted-foreground">
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {active ? (
            <>
              <Badge variant="success">{subscription?.status}</Badge>
              <Button variant="outline" disabled={pending} onClick={cancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button disabled={pending} onClick={subscribe}>
              Subscribe
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
