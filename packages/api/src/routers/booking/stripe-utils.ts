import { env } from "@zen-doc/env/server";
import {
  CREDIT_PRICE_CENTS,
  PLATFORM_NET_PER_CREDIT_CENTS,
  TAX_PER_CREDIT_CENTS,
} from "@zen-doc/pricing";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export function getPayoutAmount(credits: number): {
  total: number;
  platformFee: number;
  doctorNet: number;
} {
  const total = credits * CREDIT_PRICE_CENTS;
  const platformFee = credits * TAX_PER_CREDIT_CENTS;
  const doctorNet = credits * PLATFORM_NET_PER_CREDIT_CENTS;
  return { total, platformFee, doctorNet };
}

export function createDirectChargePaymentIntent(params: {
  amount: number;
  platformFee: number;
  doctorNet: number;
  stripeAccountId: string;
  doctorId: string;
  patientId: string;
  sessionId: string;
  description: string;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: "usd",
    transfer_data: {
      destination: params.stripeAccountId,
    },
    application_fee_amount: params.platformFee,
    description: params.description,
    metadata: {
      sessionId: params.sessionId,
      doctorId: params.doctorId,
      patientId: params.patientId,
      platformFee: String(params.platformFee),
      doctorNet: String(params.doctorNet),
    },
  });
}

export function refundPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
}
