import { moonlightCredits, patientProfiles, spriteStates } from "@zen-doc/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getManagedPatientSpriteRoute = protectedProcedure
  .input(z.object({ patientUserId: z.string().min(1) }))
  .handler(async ({ context, input }) => {
    const { userId: guardianId } = requireAuth(context);

    const [patient] = await context.db
      .select()
      .from(patientProfiles)
      .where(
        and(
          eq(patientProfiles.userId, input.patientUserId),
          eq(patientProfiles.guardianUserId, guardianId)
        )
      )
      .limit(1);

    if (!patient) {
      throw new Error("Patient not found or not managed by you");
    }

    const [sprite] = await context.db
      .select()
      .from(spriteStates)
      .where(eq(spriteStates.userId, input.patientUserId))
      .limit(1);

    const [credits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, input.patientUserId))
      .limit(1);

    return {
      sprite: sprite ?? {
        userId: input.patientUserId,
        health: 100,
        mood: "idle" as const,
        streakDays: 0,
        lastInteractionAt: null,
        createdAt: "",
        updatedAt: "",
      },
      credits: credits ?? {
        userId: input.patientUserId,
        balance: 0,
        totalEarned: 0,
        consistencyScore: 0,
      },
    };
  });
