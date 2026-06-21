import "server-only";
import { headers } from "next/headers";
import { auth } from "@atria/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  return session?.user ?? null;
}
