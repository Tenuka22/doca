import {
  creditTransactions,
  doctorPlans,
  doctorSessions,
  userCredits,
} from "@zen-doc/db";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const bookSessionRoute = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().min(1),
      planId: z.string().min(1),
      startAt: z.string().min(1),
      endAt: z.string().min(1),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId: patientId } = requireAuth(context);

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

    const creditCost = 1;

    const [userCredit] = await context.db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, patientId))
      .limit(1);

    if (!userCredit || userCredit.balance < creditCost) {
      throw new Error("Insufficient credits");
    }

    // Check for overlapping sessions with this doctor
    const overlapping = await context.db
      .select({ id: doctorSessions.id })
      .from(doctorSessions)
      .where(
        and(
          eq(doctorSessions.doctorId, input.doctorId),
          ne(doctorSessions.status, "timing_balance_failure"),
          ne(doctorSessions.status, "attended"),
          or(
            inArray(doctorSessions.status, [
              "requested",
              "rescheduled",
              "approved",
            ])
          )
        )
      );

    if (overlapping.length > 0) {
      throw new Error("You already have a pending session with this doctor");
    }

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: plan.id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "requested",
      creditCost,
      createdAt: now,
      updatedAt: now,
    });

    await context.db
      .update(userCredits)
      .set({ balance: userCredit.balance - creditCost, updatedAt: now })
      .where(eq(userCredits.userId, patientId));

    await context.db.insert(creditTransactions).values({
      id: crypto.randomUUID(),
      userId: patientId,
      amount: -creditCost,
      type: "booking",
      sessionId,
      createdAt: now,
    });

    return {
      ok: true,
      sessionId,
    };
  });
