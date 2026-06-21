export const LOCALES = ["es", "en", "pt", "zh", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export const CURRENCIES = ["USD", "BOB", "EUR", "BRL"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Featured listing pricing (in the smallest currency unit for Stripe). */
export const FEATURED_LISTING = {
  priceCents: 1500, // $15.00
  currency: "usd",
  durationDays: 30,
} as const;
