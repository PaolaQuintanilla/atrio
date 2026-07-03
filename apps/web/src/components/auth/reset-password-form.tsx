"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@atria/auth/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword"));
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) {
      toast.error(error.message ?? t("error"));
      return;
    }
    toast.success(t("resetPasswordSuccess"));
    router.push("/sign-in");
  }

  if (!token) {
    return <p className="text-sm text-muted-foreground">{t("resetPasswordInvalid")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {t("resetPasswordCta")}
      </Button>
    </form>
  );
}
