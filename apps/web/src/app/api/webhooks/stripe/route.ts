import { handleStripeWebhook } from "@atria/api";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await request.text();
  try {
    const result = await handleStripeWebhook(rawBody, signature);
    return Response.json(result);
  } catch (err) {
    console.error("Stripe webhook error", err);
    return new Response("Webhook error", { status: 400 });
  }
}
