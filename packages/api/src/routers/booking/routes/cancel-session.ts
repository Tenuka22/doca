import {
  creditTransactions,
  doctorScheduleEntries,
  doctorSessions,
  userCredits,
} from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { cancelSessionSchema } from "@zen-doc/db/schemas-types";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

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

    if (session.status !== "requested" && session.status !== "scheduled") {
      throw new Error(
        "Cannot cancel a session that has already been attended or cancelled"
      );
    }

    const now = new Date().toISOString();

    // 1. Mark session as cancelled
    await context.db
      .update(doctorSessions)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    // 2. Return reserved credits to the patient
    const [userCredit] = await context.db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, session.patientId))
      .limit(1);

    if (userCredit) {
      await context.db
        .update(userCredits)
        .set({
          balance: userCredit.balance + session.creditCost,
          updatedAt: now,
        })
        .where(eq(userCredits.userId, session.patientId));

      await context.db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        userId: session.patientId,
        amount: session.creditCost,
        type: "refund",
        sessionId: session.id,
        createdAt: now,
      });
    }

    // 3. Open up the schedule slot again
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

    return { ok: true };
  });
