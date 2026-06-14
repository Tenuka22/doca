import { patientProfiles } from "@doca/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import { getStressStore } from "../in-memory-store";
import { getBundles, getRedis } from "../simulation";
import { stressPublisher } from "../stress-publisher";

export const subscribePatientStressStreamRoute = protectedProcedure
  .input(z.object({ patientUserId: z.string().min(1) }))
  .handler(async function* ({ context, signal, input }) {
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

    yield {
      type: "state",
      bundles,
      totalSamples: buf?.totalSamples ?? 0,
      buffered: buf?.buffered ?? 0,
    } as const;

    const publisherIterator = stressPublisher.subscribe(input.patientUserId, {
      signal,
    });

    try {
      while (!signal?.aborted) {
        const { value, done } = await publisherIterator.next();
        if (done) {
          break;
        }
        if (value) {
          yield value;
        }
      }
    } finally {
      await publisherIterator.return();
    }
  });

