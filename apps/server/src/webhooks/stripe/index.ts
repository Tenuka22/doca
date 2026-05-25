import { env } from "@zen-doc/env/server";
import type { Context } from "hono";
import { Hono } from "hono";
import Stripe from "stripe";
import { handleChargeRefunded } from "./charge-refunded";
import { handleDisputeClosed } from "./dispute-closed";
import { handleDisputeCreated } from "./dispute-created";
import { handlePaymentIntentFailed } from "./payment-intent-failed";
import { handlePaymentIntentSucceeded } from "./payment-intent-succeeded";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export const stripeApp = new Hono();

stripeApp.post("/", async (c: Context) => {
  const sig = c.req.header("stripe-signature");
  const rawBody = await c.req.text();

  if (!sig) {
    return c.json({ error: "Missing signature" }, 401);
  }

  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return c.json({ error: "Invalid signature" }, 401);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      await handlePaymentIntentSucceeded(c, event);
      break;
    }

    case "payment_intent.payment_failed": {
      await handlePaymentIntentFailed(c, event);
      break;
    }

    case "charge.refunded": {
      await handleChargeRefunded(c, event);
      break;
    }

    case "charge.dispute.created": {
      await handleDisputeCreated(c, event);
      break;
    }

    case "charge.dispute.closed": {
      await handleDisputeClosed(c, event);
      break;
    }

    default:
      break;
  }

  return c.json({ received: true });
});
