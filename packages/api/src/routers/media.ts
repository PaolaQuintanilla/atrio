import { z } from "zod";
import { sellerProcedure, ORPCError, type OwnerUser } from "../orpc";
import { presignUpload, publicUrl, makeObjectKey, PUBLIC_BUCKET } from "../lib/storage";

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

export const mediaRouter = {
  /** Request a presigned URL to upload a listing image to the public bucket. */
  requestUpload: sellerProcedure
    .input(
      z.object({
        listingId: z.string(),
        fileName: z.string(),
        contentType: z.string().regex(/^image\//),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertListingOwner(context.db, input.listingId, context.user);
      const key = makeObjectKey("listings", input.fileName, input.listingId);
      const uploadUrl = await presignUpload(PUBLIC_BUCKET, key, input.contentType);
      return { uploadUrl, key, publicUrl: publicUrl(key) };
    }),

  /** Persist an uploaded image against the listing. */
  attach: sellerProcedure
    .input(
      z.object({
        listingId: z.string(),
        key: z.string(),
        url: z.string().url(),
        isCover: z.boolean().default(false),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await assertListingOwner(context.db, input.listingId, context.user);
      const count = await context.db.listingMedia.count({ where: { listingId: input.listingId } });
      if (input.isCover) {
        await context.db.listingMedia.updateMany({
          where: { listingId: input.listingId },
          data: { isCover: false },
        });
      }
      return context.db.listingMedia.create({
        data: {
          listingId: input.listingId,
          key: input.key,
          url: input.url,
          order: count,
          isCover: input.isCover || count === 0,
          width: input.width,
          height: input.height,
        },
      });
    }),

  remove: sellerProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const media = await context.db.listingMedia.findUnique({ where: { id: input.id } });
      if (!media) throw new ORPCError("NOT_FOUND");
      await assertListingOwner(context.db, media.listingId, context.user);
      await context.db.listingMedia.delete({ where: { id: input.id } });
      return { ok: true };
    }),
};
