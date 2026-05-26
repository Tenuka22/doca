import {
  creditTransactions,
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

    const [session] = await context.db
      .select()
      .from(doctorSessions)
      .where(eq(doctorSessions.id, input.sessionId))
      .limit(1);

    if (!session) {
      throw new Error("Session not found");
    }

    const isDoctor = session.doctorId === userId;
    const isPatient = session.patientId === userId;
    const isAdmin = role === "admin";
    if (!(isDoctor || isPatient || isAdmin)) {
      throw new Error("Not authorized to cancel this session");
    }

    if (session.status === "attended" || session.status === "timing_balance_failure") {
      throw new Error("Cannot cancel a session that has already ended or failed");
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({
        status: "timing_balance_failure",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

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

    return { ok: true };
  });
