import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick a localized string from a translatable JSON label, with fallback. */
export function localized(
  label: unknown,
  locale: string,
  fallback = "es",
): string {
  if (label && typeof label === "object") {
    const rec = label as Record<string, string>;
    return rec[locale] ?? rec[fallback] ?? Object.values(rec)[0] ?? "";
  }
  return typeof label === "string" ? label : "";
}

/** A number, string, or Decimal-like value (Prisma Decimal has toString). */
export type Numeric = number | string | { toString(): string };

export function formatPrice(amount: Numeric, currency = "USD", locale = "es") {
  const n = typeof amount === "number" ? amount : Number(amount.toString());
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(locale)}`;
  }
}
