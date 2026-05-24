import {
  creditTransactions,
  doctorPlans,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
  paymentIntents,
  userCredits,
} from "@zen-doc/db";
import { BASIC_PLAN_CREDITS } from "@zen-doc/pricing";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import {
  createDirectChargePaymentIntent,
  getPayoutAmount,
} from "../stripe-utils";

export const bookSessionRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      scheduleEntryId: z.string().uuid(),
      planId: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: patientId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;
    const isAdmin = role === "admin";

    const [entry] = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(
        and(
          eq(doctorScheduleEntries.id, input.scheduleEntryId),
          eq(doctorScheduleEntries.doctorId, input.doctorId),
          eq(doctorScheduleEntries.kind, "open")
        )
      )
      .limit(1);

    if (!entry) {
      throw new Error(
        "The selected schedule slot is not available or does not exist"
      );
    }

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    let creditsNeeded = BASIC_PLAN_CREDITS;
    let resolvedPlanId: string | null = null;

    if (input.planId) {
      const [plan] = await context.db
        .select()
        .from(doctorPlans)
        .where(
          and(
            eq(doctorPlans.id, input.planId),
            eq(doctorPlans.doctorId, input.doctorId),
            eq(doctorPlans.isActive, true)
          )
        )
        .limit(1);

      if (!plan) {
        throw new Error("The selected plan is not available");
      }

      creditsNeeded = plan.credits;
      resolvedPlanId = plan.id;
    }

    let creditRecord: {
      id: string;
      userId: string;
      balance: number;
      createdAt: string;
      updatedAt: string;
    } | null = null;

    if (!isAdmin) {
      const [record] = await context.db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, patientId))
        .limit(1);

      creditRecord = record ?? null;

      if (!creditRecord) {
        const creditId = crypto.randomUUID();
        await context.db.insert(userCredits).values({
          id: creditId,
          userId: patientId,
          balance: BASIC_PLAN_CREDITS,
          createdAt: now,
          updatedAt: now,
        });
        creditRecord = {
          id: creditId,
          userId: patientId,
          balance: BASIC_PLAN_CREDITS,
          createdAt: now,
          updatedAt: now,
        };
      }

      if (creditRecord.balance < creditsNeeded) {
        throw new Error("Insufficient credits to book this session");
      }

      await context.db
        .update(userCredits)
        .set({
          balance: creditRecord.balance - creditsNeeded,
          updatedAt: now,
        })
        .where(eq(userCredits.id, creditRecord.id));

      await context.db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId: patientId,
        amount: -creditsNeeded,
        type: "booking_deduction",
        referenceId: sessionId,
        description: `Booked session with doctor ${input.doctorId} (${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""})`,
        createdAt: now,
      });
    }

    const payout = getPayoutAmount(creditsNeeded);
    const isFree = isAdmin || (creditRecord?.balance ?? 0) >= creditsNeeded;
    let clientSecret: string | null = null;
    let paymentIntentId: string | null = null;
    let payoutStatus = "paid";

    if (!isFree) {
      const [doctorProfile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, input.doctorId))
        .limit(1);

      const stripeAccountId = doctorProfile?.stripeAccountId;
      const stripeEnabled = doctorProfile?.stripeAccountEnabled;

      if (!(stripeAccountId && stripeEnabled)) {
        throw new Error(
          "Doctor does not have a fully enabled Stripe Connected account"
        );
      }

      const paymentIntent = await createDirectChargePaymentIntent({
        amount: payout.total,
        platformFee: payout.platformFee,
        doctorNet: payout.doctorNet,
        stripeAccountId,
        doctorId: input.doctorId,
        patientId,
        sessionId,
        description: `Session booking with Doctor #${input.doctorId} — ${creditsNeeded} credit(s)`,
      });

      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;
      payoutStatus = "pending_payment";
    }

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: resolvedPlanId,
      startAt: entry.startAt,
      endAt: entry.endAt,
      status: "scheduled",
      payoutStatus,
      payoutAmount: payout.total,
      createdAt: now,
      updatedAt: now,
    });

    if (paymentIntentId) {
      await context.db.insert(paymentIntents).values({
        id: crypto.randomUUID(),
        sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: payout.total,
        platformFee: payout.platformFee,
        doctorAmount: payout.doctorNet,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    await context.db
      .update(doctorScheduleEntries)
      .set({
        kind: "session",
        sessionId,
        updatedAt: now,
      })
      .where(eq(doctorScheduleEntries.id, input.scheduleEntryId));

    return {
      ok: true,
      sessionId,
      clientSecret,
      isFree: payoutStatus === "paid",
    };
  });
