import { createDb, paymentIntents } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type Stripe from "stripe";

export async function handleDisputeClosed(_c: Context, event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;
  const piId = dispute.payment_intent as string | undefined;

  if (!piId) {
    return;
  }

  const db = createDb();
  const now = new Date().toISOString();

  const status = dispute.status === "won" ? "succeeded" : "dispute_lost";

  await db
    .update(paymentIntents)
    .set({ status, updatedAt: now })
    .where(eq(paymentIntents.stripePaymentIntentId, piId));
}
