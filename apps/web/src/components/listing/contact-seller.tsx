"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ContactSeller({
  listingId,
  isAuthed,
}: {
  listingId: string;
  isAuthed: boolean;
}) {
  const t = useTranslations("listing");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!isAuthed) {
    return (
      <Button className="w-full" onClick={() => router.push("/sign-in")}>
        {t("contactSeller")}
      </Button>
    );
  }

  async function send() {
    if (!message.trim()) return;
    setPending(true);
    try {
      const convo = await client.messaging.start({ listingId, message });
      toast.success("✓");
      router.push(`/messages/${convo.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={t("sendMessage")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button className="w-full" onClick={send} disabled={pending || !message.trim()}>
        {t("sendMessage")}
      </Button>
    </div>
  );
}
