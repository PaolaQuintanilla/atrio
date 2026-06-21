import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { appRouter } from "@atria/api";

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      if (process.env.NODE_ENV === "development") console.error(error);
    }),
  ],
});

async function handle(request: Request) {
  const { matched, response } = await handler.handle(request, {
    prefix: "/rpc",
    context: { headers: request.headers },
  });
  if (matched) return response;
  return new Response("Not found", { status: 404 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
