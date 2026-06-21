import { z } from "zod";
import { authedProcedure, ORPCError } from "../orpc";

export const messagingRouter = {
  /** Start (or reuse) a conversation with a listing's seller. */
  start: authedProcedure
    .input(z.object({ listingId: z.string(), message: z.string().min(1).max(2000) }))
    .handler(async ({ input, context }) => {
      const listing = await context.db.listing.findUnique({ where: { id: input.listingId } });
      if (!listing) throw new ORPCError("NOT_FOUND");
      if (listing.sellerId === context.user.id) {
        throw new ORPCError("BAD_REQUEST", { message: "You cannot message your own listing." });
      }

      const conversation = await context.db.conversation.upsert({
        where: { listingId_buyerId: { listingId: input.listingId, buyerId: context.user.id } },
        update: { lastMessageAt: new Date() },
        create: {
          listingId: input.listingId,
          buyerId: context.user.id,
          sellerId: listing.sellerId,
        },
      });

      await context.db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: context.user.id,
          body: input.message,
        },
      });

      return conversation;
    }),

  /** All conversations the user participates in (as buyer or seller). */
  conversations: authedProcedure.handler(async ({ context }) => {
    return context.db.conversation.findMany({
      where: { OR: [{ buyerId: context.user.id }, { sellerId: context.user.id }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true, image: true } },
        seller: { select: { id: true, name: true, image: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  }),

  messages: authedProcedure
    .input(z.object({ conversationId: z.string() }))
    .handler(async ({ input, context }) => {
      const convo = await context.db.conversation.findUnique({ where: { id: input.conversationId } });
      if (!convo) throw new ORPCError("NOT_FOUND");
      if (convo.buyerId !== context.user.id && convo.sellerId !== context.user.id) {
        throw new ORPCError("FORBIDDEN");
      }
      // Mark incoming messages as read.
      await context.db.message.updateMany({
        where: { conversationId: convo.id, senderId: { not: context.user.id }, readAt: null },
        data: { readAt: new Date() },
      });
      return context.db.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: "asc" },
      });
    }),

  send: authedProcedure
    .input(z.object({ conversationId: z.string(), body: z.string().min(1).max(2000) }))
    .handler(async ({ input, context }) => {
      const convo = await context.db.conversation.findUnique({ where: { id: input.conversationId } });
      if (!convo) throw new ORPCError("NOT_FOUND");
      if (convo.buyerId !== context.user.id && convo.sellerId !== context.user.id) {
        throw new ORPCError("FORBIDDEN");
      }
      const [message] = await context.db.$transaction([
        context.db.message.create({
          data: { conversationId: convo.id, senderId: context.user.id, body: input.body },
        }),
        context.db.conversation.update({
          where: { id: convo.id },
          data: { lastMessageAt: new Date() },
        }),
      ]);
      return message;
    }),
};
