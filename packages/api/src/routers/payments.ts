import { z } from "zod";
import { sellerProcedure, ORPCError } from "../orpc";
import { stripe } from "../lib/stripe";
import { FEATURED_LISTING } from "../lib/constants";

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
};
