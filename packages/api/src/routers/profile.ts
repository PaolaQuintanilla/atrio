import { z } from "zod";
import { authedProcedure, ORPCError } from "../orpc";
import { LOCALES, UPLOAD_LIMITS } from "../lib/constants";
import { presignUpload, publicUrl, makeObjectKey, PUBLIC_BUCKET } from "../lib/storage";

export const profileRouter = {
  me: authedProcedure.handler(async ({ context }) => {
    const profile = await context.db.profile.findUnique({
      where: { userId: context.user.id },
    });
    return { user: context.user, profile };
  }),

  /** Request a presigned URL to upload a profile avatar to the public bucket. */
  requestAvatarUpload: authedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        contentType: z.string(),
        sizeBytes: z.number().int().positive(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!UPLOAD_LIMITS.imageMimeTypes.includes(input.contentType as never)) {
        throw new ORPCError("BAD_REQUEST", { message: "Unsupported image type." });
      }
      if (input.sizeBytes > UPLOAD_LIMITS.imageMaxBytes) {
        throw new ORPCError("BAD_REQUEST", { message: "Image exceeds the 8 MB limit." });
      }
      const key = makeObjectKey("avatars", input.fileName, context.user.id);
      const uploadUrl = await presignUpload(PUBLIC_BUCKET, key, input.contentType);
      return { uploadUrl, key, publicUrl: publicUrl(key) };
    }),

  /** Promote the current BUYER account to SELLER so they can post listings. */
  becomeSeller: authedProcedure.handler(async ({ context }) => {
    if (context.user.role === "BUYER") {
      await context.db.user.update({ where: { id: context.user.id }, data: { role: "SELLER" } });
    }
    return { role: "SELLER" as const };
  }),

  update: authedProcedure
    .input(
      z.object({
        displayName: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
        avatarUrl: z.string().url().optional(),
        locale: z.enum(LOCALES).optional(),
        country: z.string().max(80).optional(),
        city: z.string().max(120).optional(),
        bio: z.string().max(1000).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { displayName, avatarUrl } = input;

      const profile = await context.db.profile.upsert({
        where: { userId: context.user.id },
        update: input,
        create: { userId: context.user.id, ...input },
      });

      // Synchronize User model's name and image for better auth session sync
      if (displayName !== undefined || avatarUrl !== undefined) {
        await context.db.user.update({
          where: { id: context.user.id },
          data: {
            ...(displayName !== undefined ? { name: displayName } : {}),
            ...(avatarUrl !== undefined ? { image: avatarUrl } : {}),
          },
        });
      }

      return profile;
    }),
};
