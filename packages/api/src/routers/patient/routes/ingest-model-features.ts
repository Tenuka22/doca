import { z } from "zod";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";
import {
  getSequenceMetadata,
  predictAllSequenceProbabilities,
} from "../../../models/wesad-lstm";

const ingestModelFeaturesSchema = z.object({
  sample: z.array(z.number().finite()).length(5),
  timestamp: z.number().finite().optional(),
});

interface StoredFeatureSample {
  sample: number[];
  timestamp: number;
}

function kvKey(userId: string): string {
  return `model-features:${userId}`;
}

export const ingestModelFeaturesRoute = protectedProcedure
  .input(ingestModelFeaturesSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { featureCount, triggerWindowLength } = getSequenceMetadata();

    if (input.sample.length !== featureCount) {
      throw new Error(`Expected ${featureCount} features per sample`);
    }

    const now = input.timestamp ?? Date.now();
    const storageKey = kvKey(userId);
    const previous = await context.modelFeaturesKv.get<StoredFeatureSample[]>(
      storageKey,
      "json"
    );
    const records = previous ?? [];

    records.push({
      sample: input.sample,
      timestamp: now,
    });

    const windowedRecords = records.slice(-triggerWindowLength);
    await context.modelFeaturesKv.put(
      storageKey,
      JSON.stringify(windowedRecords)
    );

    if (windowedRecords.length < triggerWindowLength) {
      return {
        created: false,
        windowSize: windowedRecords.length,
        requiredWindowSize: triggerWindowLength,
      };
    }

    const windowSamples = windowedRecords.map((record) => record.sample);
    const { averageProbability, probabilities } =
      await predictAllSequenceProbabilities(windowSamples);

    const prediction = averageProbability >= 0.5 ? "stress" : "non_stress";
    const result = {
      prediction,
      probability: averageProbability,
      probabilities,
      windowSize: triggerWindowLength,
      timestamp: now,
    };

    await context.modelFeaturesKv.put(
      `${storageKey}:predictions:${now}`,
      JSON.stringify(result)
    );

    return {
      created: true,
      ...result,
    };
  });
