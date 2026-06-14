import {
  doctorCashoutRequests,
  doctorCredits,
  doctorProfiles,
} from "@doca/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStripe } from "../stripe-utils";

export const getDoctorCreditsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId: doctorId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, doctorId))
      .limit(1);

    const cashoutRequests = await context.db
      .select()
      .from(doctorCashoutRequests)
      .where(eq(doctorCashoutRequests.doctorId, doctorId))
      .orderBy(doctorCashoutRequests.createdAt);

    return {
      credits: credits ?? {
        doctorId,
        balanceCents: 0,
        totalEarnedCents: 0,
        totalCashedOutCents: 0,
      },
      cashoutRequests,
    };
  }
);

export const requestCashoutRoute = protectedProcedure
  .input(
    z.object({
      amountCents: z.number().int().positive(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: doctorId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, doctorId))
      .limit(1);

    if (!credits || credits.balanceCents < input.amountCents) {
      throw new Error("Insufficient credit balance");
    }

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, doctorId))
      .limit(1);

    if (!(profile?.stripeAccountId && profile.stripeAccountEnabled)) {
      throw new Error("Stripe Connect account not set up");
    }

    const stripe = getStripe();
    const now = new Date().toISOString();
    const cashoutId = crypto.randomUUID();

    try {
      const transfer = await stripe.transfers.create({
        amount: input.amountCents,
        currency: "usd",
        destination: profile.stripeAccountId,
        metadata: {
          doctorId,
          cashoutId,
          type: "doctor_cashout",
        },
      });

      await context.db.insert(doctorCashoutRequests).values({
        id: cashoutId,
        doctorId,
        amountCents: input.amountCents,
        status: "completed",
        stripeTransferId: transfer.id,
        createdAt: now,
        updatedAt: now,
      });

      await context.db
        .update(doctorCredits)
        .set({
          balanceCents: credits.balanceCents - input.amountCents,
          totalCashedOutCents: credits.totalCashedOutCents + input.amountCents,
          updatedAt: now,
        })
        .where(eq(doctorCredits.doctorId, doctorId));

      return { ok: true, transferId: transfer.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      await context.db.insert(doctorCashoutRequests).values({
        id: cashoutId,
        doctorId,
        amountCents: input.amountCents,
        status: "failed",
        failureReason: msg,
        createdAt: now,
        updatedAt: now,
      });

      throw new Error(`Cashout failed: ${msg}`);
    }
  });

