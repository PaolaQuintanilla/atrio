import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "./router";

export type ApiClient = RouterClient<AppRouter>;

/**
 * Build a typed oRPC client pointed at the app's /rpc endpoint. The web app
 * creates one instance for the browser and one per-request on the server
 * (forwarding cookies via `headers`).
 */
export function createApiClient(options: {
  url: string;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}): ApiClient {
  const link = new RPCLink({
    url: options.url,
    headers: options.headers,
  });
  return createORPCClient(link);
}
