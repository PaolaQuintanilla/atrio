import { z } from "zod";
import { sellerProcedure, ORPCError, type OwnerUser } from "../orpc";
import { presignUpload, presignDownload, makeObjectKey, PRIVATE_BUCKET } from "../lib/storage";

const DOC_TYPES = [
  "TITLE_DEED",
  "DERECHOS_REALES",
  "ID_DOCUMENT",
  "VEHICLE_TITLE",
  "TAX_RECEIPT",
  "OTHER",
] as const;

async function assertListingOwner(
  db: typeof import("@atria/db").prisma,
  listingId: string,
  user: OwnerUser,
) {
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ORPCError("NOT_FOUND");
  if (listing.sellerId !== user.id && user.role !== "ADMIN") throw new ORPCError("FORBIDDEN");
  return listing;
}

export const documentsRouter = {
  /** Presigned upload to the PRIVATE bucket - legal/ownership documents. */
  requestUpload: sellerProcedure
    .input(
      z.object({
        listingId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertListingOwner(context.db, input.listingId, context.user);
      const key = makeObjectKey("documents", input.fileName, input.listingId);
      const uploadUrl = await presignUpload(PRIVATE_BUCKET, key, input.contentType);
      return { uploadUrl, key };
    }),

  /** Record an uploaded document and move the listing into the verification queue. */
  attach: sellerProcedure
    .input(
      z.object({
        listingId: z.string(),
        type: z.enum(DOC_TYPES),
        key: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().int().nonnegative(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertListingOwner(context.db, input.listingId, context.user);
      const [doc] = await context.db.$transaction([
        context.db.listingDocument.create({ data: { ...input, verificationStatus: "PENDING" } }),
        context.db.listing.update({
          where: { id: input.listingId },
          data: { verificationStatus: "PENDING" },
        }),
      ]);
      return doc;
    }),

  /** List documents for a listing (owner or admin only). */
  list: sellerProcedure
    .input(z.object({ listingId: z.string() }))
    .handler(async ({ input, context }) => {
      await assertListingOwner(context.db, input.listingId, context.user);
      return context.db.listingDocument.findMany({
        where: { listingId: input.listingId },
        orderBy: { uploadedAt: "desc" },
      });
    }),

  /** Short-lived signed URL to view a private document (owner or admin only). */
  downloadUrl: sellerProcedure
    .input(z.object({ documentId: z.string() }))
    .handler(async ({ input, context }) => {
      const doc = await context.db.listingDocument.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new ORPCError("NOT_FOUND");
      await assertListingOwner(context.db, doc.listingId, context.user);
      const url = await presignDownload(PRIVATE_BUCKET, doc.key);
      return { url };
    }),
};
