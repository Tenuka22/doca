import { createDb, paymentIntents } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

export async function handleChargeRefunded(_c: Context, event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const piId = charge.payment_intent as string | undefined;

  if (!piId) {
    return;
  }

  const db = createDb();

  await db
    .update(paymentIntents)
    .set({
      status: "refunded",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paymentIntents.stripePaymentIntentId, piId));
}
