import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@atria/auth";

export const { GET, POST } = toNextJsHandler(auth);
