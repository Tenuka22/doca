import { doctorCredits, doctorSessions } from "@zen-doc/db";
import { CREDIT_PRICE_CENTS } from "@zen-doc/pricing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const acceptRescheduledSessionRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
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
      throw new Error("Only the patient can accept a rescheduled session");
    }

    if (session.status !== "rescheduled") {
      throw new Error("Session is not awaiting your acceptance");
    }

    const now = new Date().toISOString();
    const earnedCents = session.creditCost * CREDIT_PRICE_CENTS;

    await context.db
      .update(doctorSessions)
      .set({
        status: "approved",
        doctorEarnedCents: earnedCents,
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    const [existingCredits] = await context.db
      .select()
      .from(doctorCredits)
      .where(eq(doctorCredits.doctorId, session.doctorId))
      .limit(1);

    if (existingCredits) {
      await context.db
        .update(doctorCredits)
        .set({
          balanceCents: existingCredits.balanceCents + earnedCents,
          totalEarnedCents: existingCredits.totalEarnedCents + earnedCents,
          updatedAt: now,
        })
        .where(eq(doctorCredits.doctorId, session.doctorId));
    } else {
      await context.db.insert(doctorCredits).values({
        doctorId: session.doctorId,
        balanceCents: earnedCents,
        totalEarnedCents: earnedCents,
        totalCashedOutCents: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  });
