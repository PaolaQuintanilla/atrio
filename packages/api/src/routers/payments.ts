import { z } from "zod";
import { sellerProcedure, ORPCError } from "../orpc";
import { stripe } from "../lib/stripe";
import { FEATURED_LISTING, SELLER_SUBSCRIPTION } from "../lib/constants";

export const paymentsRouter = {
  /** Create a Stripe Checkout session to feature a listing. */
  featureListing: sellerProcedure
    .input(z.object({ listingId: z.string() }))
    .handler(async ({ input, context }) => {
      const listing = await context.db.listing.findUnique({ where: { id: input.listingId } });
      if (!listing) throw new ORPCError("NOT_FOUND");
      if (listing.sellerId !== context.user.id && context.user.role !== "ADMIN") {
        throw new ORPCError("FORBIDDEN");
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const checkout = await stripe().checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: FEATURED_LISTING.currency,
              unit_amount: FEATURED_LISTING.priceCents,
              product_data: {
                name: `Featured listing - ${listing.title}`,
                description: `${FEATURED_LISTING.durationDays} days of featured placement`,
              },
            },
          },
        ],
        success_url: `${appUrl}/dashboard/listings/${listing.id}?featured=success`,
        cancel_url: `${appUrl}/dashboard/listings/${listing.id}?featured=cancel`,
        metadata: { listingId: listing.id, userId: context.user.id },
      });

      await context.db.payment.create({
        data: {
          userId: context.user.id,
          listingId: listing.id,
          kind: "FEATURED_LISTING",
          status: "PENDING",
          amount: FEATURED_LISTING.priceCents / 100,
          currency: FEATURED_LISTING.currency.toUpperCase(),
          stripeSessionId: checkout.id,
        },
      });

      return { url: checkout.url };
    }),

  /** Payment history for the current user. */
  history: sellerProcedure.handler(async ({ context }) => {
    return context.db.payment.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { id: true, title: true } } },
    });
  }),

  /** Start (or resume) the seller "Pro" subscription via Stripe Checkout. */
  subscribe: sellerProcedure.handler(async ({ context }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Ensure a Stripe customer + a Subscription row to anchor the webhook on.
    let sub = await context.db.subscription.findUnique({ where: { userId: context.user.id } });
    if (sub?.status === "active") {
      throw new ORPCError("BAD_REQUEST", { message: "You already have an active subscription." });
    }

    let customerId = sub?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: context.user.email,
        name: context.user.name,
        metadata: { userId: context.user.id },
      });
      customerId = customer.id;
      sub = await context.db.subscription.upsert({
        where: { userId: context.user.id },
        update: { stripeCustomerId: customerId },
        create: { userId: context.user.id, stripeCustomerId: customerId, status: "inactive" },
      });
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: SELLER_SUBSCRIPTION.currency,
            unit_amount: SELLER_SUBSCRIPTION.priceCents,
            recurring: { interval: SELLER_SUBSCRIPTION.interval },
            product_data: { name: `Atria ${SELLER_SUBSCRIPTION.plan} (seller plan)` },
          },
        },
      ],
      success_url: `${appUrl}/dashboard/payments?subscription=success`,
      cancel_url: `${appUrl}/dashboard/payments?subscription=cancel`,
      metadata: { userId: context.user.id, plan: SELLER_SUBSCRIPTION.plan },
    });

    return { url: checkout.url };
  }),

  /** The current user's subscription status. */
  mySubscription: sellerProcedure.handler(async ({ context }) => {
    return context.db.subscription.findUnique({ where: { userId: context.user.id } });
  }),

  /** Cancel the subscription at the end of the current billing period. */
  cancelSubscription: sellerProcedure.handler(async ({ context }) => {
    const sub = await context.db.subscription.findUnique({ where: { userId: context.user.id } });
    if (!sub?.stripeSubscriptionId) {
      throw new ORPCError("NOT_FOUND", { message: "No active subscription." });
    }
    await stripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    return { ok: true };
  }),
};
