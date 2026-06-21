import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API, RPC, auth, static assets and files with an extension.
  matcher: ["/((?!api|rpc|_next|_vercel|.*\\..*).*)"],
};
