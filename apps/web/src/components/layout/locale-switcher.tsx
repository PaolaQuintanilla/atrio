"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, type AppLocale } from "@/i18n/routing";
import { Select } from "@/components/ui/select";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as AppLocale });
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
      <Select
        aria-label="Language"
        value={locale}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-auto pl-8 pr-7"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </Select>
    </div>
  );
}
