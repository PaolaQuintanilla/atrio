import Stripe from "stripe";
import { prisma } from "@atria/db";
import { FEATURED_LISTING } from "./constants";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (payment && payment.status !== "PAID") {
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
  }

  return { received: true, type: event.type };
}
