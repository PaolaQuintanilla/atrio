"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BecomeSeller() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function upgrade() {
    setPending(true);
    await client.profile.becomeSeller();
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
          <Store className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Start selling on Atria</h2>
          <p className="text-sm text-muted-foreground">
            Switch your account to a seller account to post listings.
          </p>
        </div>
        <Button onClick={upgrade} disabled={pending}>
          Become a seller
        </Button>
      </CardContent>
    </Card>
  );
}
