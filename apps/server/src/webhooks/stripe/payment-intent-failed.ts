import { createDb, paymentIntents } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

export async function handlePaymentIntentFailed(
  _c: Context,
  event: Stripe.Event
) {
  const failedIntent = event.data.object as Stripe.PaymentIntent;

  if (!failedIntent.id) {
    return;
  }

  const db = createDb();

  await db
    .update(paymentIntents)
    .set({
      status: "failed",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paymentIntents.stripePaymentIntentId, failedIntent.id));
}
