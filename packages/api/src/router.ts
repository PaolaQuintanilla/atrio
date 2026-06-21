import { categoriesRouter } from "./routers/categories";
import { profileRouter } from "./routers/profile";
import { listingsRouter } from "./routers/listings";
import { searchRouter } from "./routers/search";
import { favoritesRouter } from "./routers/favorites";
import { mediaRouter } from "./routers/media";
import { documentsRouter } from "./routers/documents";
import { verificationRouter } from "./routers/verification";
import { messagingRouter } from "./routers/messaging";
import { paymentsRouter } from "./routers/payments";
import { adminRouter } from "./routers/admin";

export const appRouter = {
  categories: categoriesRouter,
  profile: profileRouter,
  listings: listingsRouter,
  search: searchRouter,
  favorites: favoritesRouter,
  media: mediaRouter,
  documents: documentsRouter,
  verification: verificationRouter,
  messaging: messagingRouter,
  payments: paymentsRouter,
  admin: adminRouter,
};

export type AppRouter = typeof appRouter;
