import {
  creditTransactions,
  doctorPlans,
  doctorScheduleEntries,
  doctorSessions,
  userCredits,
} from "@zen-doc/db";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

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

    // Resolve plan and credit cost
    const [plan] = await context.db
      .select()
      .from(doctorPlans)
      .where(
        and(
          input.planId ? eq(doctorPlans.id, input.planId) : eq(doctorPlans.isDefault, true),
          eq(doctorPlans.doctorId, input.doctorId),
          eq(doctorPlans.isActive, true)
        )
      )
      .limit(1);

    if (!plan) {
      throw new Error("The selected plan is not available");
    }

    const creditCost = 1; // Assuming default 1 credit per 60 min session as requested

    // Check user credits
    const [userCredit] = await context.db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, patientId))
      .limit(1);

    if (!userCredit || userCredit.balance < creditCost) {
      throw new Error("Insufficient credits");
    }

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    // Perform operations in a transaction (db.transaction) if available
    await context.db.insert(doctorSessions).values({
      id: sessionId,
      doctorId: input.doctorId,
      patientId,
      planId: plan.id,
      startAt: entry.startAt,
      endAt: entry.endAt,
      status: "requested",
      creditCost: creditCost,
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
      sessionId: sessionId,
      createdAt: now,
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
    };
  });
