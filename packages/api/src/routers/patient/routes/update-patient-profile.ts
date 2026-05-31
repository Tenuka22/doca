import { patientProfiles } from "@zen-doc/db";
import { updatePatientProfileSchema } from "@zen-doc/db/schemas-types";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const updatePatientProfileRoute = protectedProcedure
  .input(updatePatientProfileSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    await context.db
      .update(patientProfiles)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(patientProfiles.userId, userId));

    const updated = await context.db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, userId),
    });

    return { success: true, profile: updated };
  });
