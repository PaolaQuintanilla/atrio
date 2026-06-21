"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@atria/api";

const link = new RPCLink({
  url: () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/rpc`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/rpc`,
});

export const client: RouterClient<AppRouter> = createORPCClient(link);

/** TanStack Query helpers: orpc.<router>.<proc>.queryOptions({ input }) etc. */
export const orpc = createTanstackQueryUtils(client);
