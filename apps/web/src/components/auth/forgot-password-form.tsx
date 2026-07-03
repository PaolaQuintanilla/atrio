"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@atria/auth/client";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${localePrefix}/reset-password`,
    });
    setPending(false);
    if (error) {
      toast.error(error.message ?? t("error"));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">{t("forgotPasswordSent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {t("forgotPasswordCta")}
      </Button>
    </form>
  );
}
