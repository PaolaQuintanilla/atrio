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

/** Upload constraints enforced server-side before issuing a presigned URL. */
export const UPLOAD_LIMITS = {
  imageMaxBytes: 8 * 1024 * 1024, // 8 MB
  documentMaxBytes: 20 * 1024 * 1024, // 20 MB
  imageMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
  documentMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
} as const;
