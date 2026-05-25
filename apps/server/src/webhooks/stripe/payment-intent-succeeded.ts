import { createDb, doctorSessions, paymentIntents } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

export async function handlePaymentIntentSucceeded(
  _c: Context,
  event: Stripe.Event
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  if (!paymentIntent.id) {
    return;
  }

  const sessionId = paymentIntent.metadata?.sessionId;

  if (!sessionId) {
    return;
  }

  const db = createDb();

  await db
    .update(doctorSessions)
    .set({
      payoutStatus: "paid",
      payoutTransferId:
        (paymentIntent.transfer_data?.destination as string | undefined) ??
        null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(doctorSessions.id, sessionId));

  await db
    .update(paymentIntents)
    .set({
      status: "succeeded",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paymentIntents.stripePaymentIntentId, paymentIntent.id));
}
