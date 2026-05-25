import {
  doctorPlans,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
  paymentIntents,
} from "@zen-doc/db";
import { and, eq, or } from "drizzle-orm";
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
    const { userId: patientId } = requireAuth(context);

    const [entry] = await context.db
      .select({
        id: doctorScheduleEntries.id,
        doctorId: doctorScheduleEntries.doctorId,
        kind: doctorScheduleEntries.kind,
        startAt: doctorScheduleEntries.startAt,
        endAt: doctorScheduleEntries.endAt,
      })
      .from(doctorScheduleEntries)
      .leftJoin(
        doctorSessions,
        eq(doctorScheduleEntries.sessionId, doctorSessions.id)
      )
      .where(
        and(
          eq(doctorScheduleEntries.id, input.scheduleEntryId),
          eq(doctorScheduleEntries.doctorId, input.doctorId),
          or(
            eq(doctorScheduleEntries.kind, "open"),
            and(
              eq(doctorScheduleEntries.kind, "session"),
              eq(doctorSessions.status, "cancelled")
            )
          )
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

    let planPrice = 0;
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

      planPrice = plan.price;
      resolvedPlanId = plan.id;
    } else {
      const [defaultPlan] = await context.db
        .select()
        .from(doctorPlans)
        .where(
          and(
            eq(doctorPlans.doctorId, input.doctorId),
            eq(doctorPlans.isActive, true)
          )
        )
        .orderBy(doctorPlans.sortOrder)
        .limit(1);

      if (!defaultPlan) {
        throw new Error("Doctor has no available plans");
      }

      planPrice = defaultPlan.price;
      resolvedPlanId = defaultPlan.id;
    }

    const payout = getPayoutAmount(planPrice);
    let clientSecret: string | null = null;
    let paymentIntentId: string | null = null;

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
      description: `Session booking with Doctor #${input.doctorId}`,
    });

    clientSecret = paymentIntent.client_secret;
    paymentIntentId = paymentIntent.id;

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: resolvedPlanId,
      startAt: entry.startAt,
      endAt: entry.endAt,
      status: "pending",
      payoutStatus: "pending_payment",
      payoutAmount: payout.total,
      createdAt: now,
      updatedAt: now,
    });

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
      isFree: false,
    };
  });
