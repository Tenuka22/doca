import { doctorSessions, paymentIntents } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../stripe-utils";

export const confirmBookingPaymentRoute = protectedProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      paymentIntentId: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.patientId !== userId) {
      throw new Error("Only the patient can confirm payment");
    }

    // Webhook may have already processed it
    if (session.payoutStatus === "paid") {
      return { ok: true, payoutStatus: "paid" };
    }

    if (session.payoutStatus !== "pending_payment") {
      throw new Error("Session is not awaiting payment");
    }

    // Fallback: verify with Stripe directly if webhook hasn't arrived yet
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(
      input.paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      throw new Error(
        `Payment has not succeeded yet. Status: ${paymentIntent.status}`
      );
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({
        payoutStatus: "paid",
        payoutTransferId:
          (paymentIntent.transfer_data?.destination as string | undefined) ??
          null,
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    await context.db
      .update(paymentIntents)
      .set({
        status: "succeeded",
        updatedAt: now,
      })
      .where(eq(paymentIntents.stripePaymentIntentId, input.paymentIntentId));

    return { ok: true, payoutStatus: "paid" };
  });
