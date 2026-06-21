import "server-only";
import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { appRouter } from "@atria/api";

/**
 * Server-side oRPC caller for React Server Components and server actions.
 * Calls the router directly (no HTTP round-trip), forwarding request headers
 * so Better Auth can resolve the session.
 */
export const api = createRouterClient(appRouter, {
  context: async () => ({ headers: await headers() }),
});
