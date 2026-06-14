import { CREDIT_PRICE_CENTS, TAX_RATE } from "@doca/pricing";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../../booking/stripe-utils";

const DEFAULT_CREDIT_QUANTITY = 1;

export const purchaseCreditsRoute = protectedProcedure
  .input(
    z.object({
      credits: z.number().int().positive().default(DEFAULT_CREDIT_QUANTITY),
      returnUrl: z.string().url().optional(),
      patientUserId: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const stripe = getStripe();
    const subtotalCents = input.credits * CREDIT_PRICE_CENTS;
    const taxCents = Math.ceil(subtotalCents * TAX_RATE);
    const amount = subtotalCents + taxCents;

    const creditUserId = input.patientUserId ?? userId;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "credit_topup",
        userId: creditUserId,
        purchasedByUserId: input.patientUserId ? userId : null,
        credits: String(input.credits),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount,
      subtotalCents,
      taxCents,
      credits: input.credits,
    };
  });
