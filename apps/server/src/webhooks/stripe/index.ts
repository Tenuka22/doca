import { createDb, creditTransactions, userCredits } from "@zen-doc/db";
import { env } from "@zen-doc/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import Stripe from "stripe";

export const stripeApp = new Hono();

stripeApp.post("/", async (c) => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const db = createDb();
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.text("Missing signature", 400);
  }

  const body = await c.req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return c.text("Webhook Error", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const creditsToAdd = Number.parseInt(session.metadata?.credits ?? "0", 10);

    if (userId && creditsToAdd > 0) {
      await db.transaction(async (tx) => {
        const [userCredit] = await tx
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);

        if (userCredit) {
          await tx
            .update(userCredits)
            .set({
              balance: userCredit.balance + creditsToAdd,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(userCredits.userId, userId));
        } else {
          await tx.insert(userCredits).values({
            userId,
            balance: creditsToAdd,
          });
        }

        await tx.insert(creditTransactions).values({
          id: crypto.randomUUID(),
          userId,
          amount: creditsToAdd,
          type: "purchase",
          createdAt: new Date().toISOString(),
        });
      });
    }
  }

  return c.text("OK");
});
