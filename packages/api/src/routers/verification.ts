import { z } from "zod";
import { adminProcedure, ORPCError } from "../orpc";
import { presignDownload, PRIVATE_BUCKET } from "../lib/storage";

export const verificationRouter = {
  /** Listings awaiting verification. */
  queue: adminProcedure.handler(async ({ context }) => {
    return context.db.listing.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { updatedAt: "asc" },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        category: { select: { slug: true, name: true } },
        documents: true,
      },
    });
  }),

  /** Full review view with signed document URLs. */
  review: adminProcedure
    .input(z.object({ listingId: z.string() }))
    .handler(async ({ input, context }) => {
      const listing = await context.db.listing.findUnique({
        where: { id: input.listingId },
        include: {
          documents: true,
          seller: { select: { id: true, name: true, email: true } },
          reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { name: true } } } },
        },
      });
      if (!listing) throw new ORPCError("NOT_FOUND");

      const documents = await Promise.all(
        listing.documents.map(async (d) => ({
          ...d,
          url: await presignDownload(PRIVATE_BUCKET, d.key),
        })),
      );

      return { ...listing, documents };
    }),

  /** Approve or reject a listing's verification; records an audit entry. */
  decide: adminProcedure
    .input(
      z.object({
        listingId: z.string(),
        decision: z.enum(["APPROVED", "REJECTED"]),
        notes: z.string().max(2000).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const status = input.decision === "APPROVED" ? "VERIFIED" : "REJECTED";
      await context.db.$transaction([
        context.db.verificationReview.create({
          data: {
            listingId: input.listingId,
            reviewerId: context.user.id,
            decision: input.decision,
            notes: input.notes,
          },
        }),
        context.db.listing.update({
          where: { id: input.listingId },
          data: { verificationStatus: status },
        }),
        context.db.listingDocument.updateMany({
          where: { listingId: input.listingId },
          data: { verificationStatus: status },
        }),
      ]);
      return { ok: true, status };
    }),
};
