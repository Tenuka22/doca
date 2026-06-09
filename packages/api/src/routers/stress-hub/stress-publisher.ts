import { EventPublisher } from "@orpc/server";

export interface RawSample {
  sample: number[];
  timestamp: number;
}

export interface StoredPrediction {
  predictedClass: string;
  probabilities: number[];
  sampleCount: number;
  timestamp: number;
  windowStart: number;
}

export interface StressBundle {
  bundleId: string;
  createdAt: number;
  prediction: StoredPrediction | null;
  samples: RawSample[];
}

export type StressStreamEvent =
  | {
      type: "state";
      bundles: StressBundle[];
      totalSamples: number;
      buffered: number;
    }
  | {
      type: "bundle";
      data: StressBundle;
    }
  | {
      type: "progress";
      buffered: number;
      totalSamples: number;
    };

export const stressPublisher = new EventPublisher<
  Record<string, StressStreamEvent>
>({
  maxBufferedEvents: 100,
});
