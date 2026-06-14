import { patientProfiles, stressDownloadAcknowledgments } from "@doca/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { BUNDLE_LIST_KEY, BUNDLE_TTL_SECONDS, getRedis } from "../simulation";

const ONE_DAY = 86_400;

export const guardianAcknowledgeDownloadRoute = protectedProcedure
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
    const now = new Date().toISOString();

    await context.db
      .insert(stressDownloadAcknowledgments)
      .values({
        userId: input.patientUserId,
        guardianAcknowledgedAt: now,
      })
      .onConflictDoUpdate({
        target: stressDownloadAcknowledgments.userId,
        set: { guardianAcknowledgedAt: now, updatedAt: now },
      });

    const ackRecord = await context.db
      .select()
      .from(stressDownloadAcknowledgments)
      .where(eq(stressDownloadAcknowledgments.userId, input.patientUserId))
      .limit(1);

    const record = ackRecord[0];

    const bundleKey = `${BUNDLE_LIST_KEY}${input.patientUserId}`;

    const patientAcked = Boolean(record?.patientAcknowledgedAt);
    const guardianAcked = Boolean(record?.guardianAcknowledgedAt);

    const shouldExpireSoon = patientAcked && guardianAcked;

    if (shouldExpireSoon) {
      await redis.expire(bundleKey, ONE_DAY);
    } else {
      await redis.expire(bundleKey, BUNDLE_TTL_SECONDS);
    }

    return {
      acknowledged: true,
      ttlAdjusted: shouldExpireSoon ? ONE_DAY : BUNDLE_TTL_SECONDS,
      patientAcked,
      guardianAcked,
    };
  });

