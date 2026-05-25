import { doctorSessions } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const confirmSessionRoute = protectedProcedure
  .input(z.object({ sessionId: z.string().min(1) }))
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
    const isAdmin = role === "admin";
    if (!(isDoctor || isAdmin)) {
      throw new Error("Only the doctor can confirm this session");
    }

    if (session.status !== "pending") {
      throw new Error(
        "Can only confirm sessions that are awaiting confirmation"
      );
    }

    if (session.payoutStatus !== "paid") {
      throw new Error("Cannot confirm a session that has not been paid");
    }

    const now = new Date().toISOString();

    await context.db
      .update(doctorSessions)
      .set({
        status: "scheduled",
        updatedAt: now,
      })
      .where(eq(doctorSessions.id, input.sessionId));

    return { ok: true };
  });
