import {
  creditTransactions,
  doctorScheduleEntries,
  doctorSessions,
  paymentIntents,
  userCredits,
} from "@zen-doc/db";
import { cancelSessionSchema } from "@zen-doc/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { refundPaymentIntent } from "../stripe-utils";

export const cancelSessionRoute = protectedProcedure
  .input(cancelSessionSchema)
  .handler(async ({ context, input }) => {
    const { userId, auth } = requireAuth(context);
    const role = auth.sessionClaims?.metadata?.role;
    const isAdmin = role === "admin";

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    if (!(isDoctor || isAdmin)) {
      throw new Error("Only the doctor can cancel this session");
    }

    if (session.status !== "scheduled") {
      throw new Error(
        "Cannot cancel a session that has already been attended or cancelled"
      );
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    const [scheduleEntry] = await context.db
      .select()
      .from(doctorScheduleEntries)
      .where(eq(doctorScheduleEntries.sessionId, input.sessionId))
      .limit(1);

    if (scheduleEntry) {
      await context.db
        .update(doctorScheduleEntries)
        .set({
          kind: "open",
          sessionId: null,
          updatedAt: now,
        })
        .where(eq(doctorScheduleEntries.id, scheduleEntry.id));
    }

    const [paymentRecord] = await context.db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.sessionId, input.sessionId))
      .limit(1);

    if (
      paymentRecord?.stripePaymentIntentId &&
      paymentRecord.status === "succeeded"
    ) {
      try {
        await refundPaymentIntent(paymentRecord.stripePaymentIntentId);

        await context.db
          .update(paymentIntents)
          .set({
            status: "refunded",
            updatedAt: now,
          })
          .where(eq(paymentIntents.id, paymentRecord.id));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to refund payment: ${msg}`);
      }
    } else if (
      paymentRecord?.status === "pending" &&
      paymentRecord.stripePaymentIntentId
    ) {
      try {
        const stripe = (await import("../stripe-utils")).getStripe();
        await stripe.paymentIntents.cancel(paymentRecord.stripePaymentIntentId);

        await context.db
          .update(paymentIntents)
          .set({
            status: "refunded",
            updatedAt: now,
          })
          .where(eq(paymentIntents.id, paymentRecord.id));
      } catch {
        // Payment intent may already have been canceled
      }
    }

    if (!isAdmin) {
      let [creditRecord] = await context.db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, session.patientId))
        .limit(1);

      if (!creditRecord) {
        const creditId = crypto.randomUUID();
        await context.db.insert(userCredits).values({
          id: creditId,
          userId: session.patientId,
          balance: 1,
          createdAt: now,
          updatedAt: now,
        });
        creditRecord = {
          id: creditId,
          userId: session.patientId,
          balance: 1,
          createdAt: now,
          updatedAt: now,
        };
      }

      await context.db
        .update(userCredits)
        .set({
          balance: creditRecord.balance + 1,
          updatedAt: now,
        })
        .where(eq(userCredits.id, creditRecord.id));

      await context.db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId: session.patientId,
        amount: 1,
        type: "cancellation_refund",
        referenceId: input.sessionId,
        description: "Session cancelled by doctor, credit refunded",
        createdAt: now,
      });
    }

    return { ok: true };
  });
