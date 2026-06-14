import { patientProfiles } from "@doca/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStressStore } from "../in-memory-store";
import { getBundles, getRedis } from "../simulation";

export const getPatientStressDataGuardianRoute = protectedProcedure
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

    const redis = getRedis();
    const store = getStressStore();

    const [bundles, buf] = await Promise.all([
      getBundles(redis, input.patientUserId, 100),
      Promise.resolve(store.getBuffer(input.patientUserId)),
    ]);

    return {
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      fetchedAt: Date.now(),
    };
  });
