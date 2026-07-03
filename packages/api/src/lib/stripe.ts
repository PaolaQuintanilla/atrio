import Stripe from "stripe";
import { prisma } from "@atria/db";
import { FEATURED_LISTING, SELLER_SUBSCRIPTION } from "./constants";

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  }
  return _stripe;
}

/**
 * Verify and process a Stripe webhook event. Called from the Next.js webhook
 * route with the raw request body and signature header.
 */
export async function handleStripeWebhook(rawBody: string | Buffer, signature: string) {
  const event = stripe().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? "",
  );

  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
  }

  return { received: true, type: event.type };
}

/** One-time payments (featured listings) settle here; subscriptions settle via subscription events. */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") return;

  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
  if (!payment || payment.status === "PAID") return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
  });

  if (payment.kind === "FEATURED_LISTING" && payment.listingId) {
    const until = new Date();
    until.setDate(until.getDate() + FEATURED_LISTING.durationDays);
    await prisma.listing.update({
      where: { id: payment.listingId },
      data: { isFeatured: true, featuredUntil: until },
    });
  }
}

/** Mirror Stripe subscription state onto our Subscription row (keyed by customer). */
async function onSubscriptionChange(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const existing = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!existing) return;

  // `current_period_end` location varies across Stripe API versions.
  const raw = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const periodEndUnix = raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      stripeSubscriptionId: sub.id,
      status: sub.status, // active | trialing | past_due | canceled | unpaid | …
      plan: SELLER_SUBSCRIPTION.plan,
      currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
    },
  });
}
