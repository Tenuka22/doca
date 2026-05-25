import ort from "onnxruntime-web";

const FEATURE_COUNT = 5;
const SEQUENCE_LENGTHS = [30, 60, 90] as const;
ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/";
ort.env.wasm.numThreads = 1;

const MODEL_PATHS = {
  30: "../../../../apps/model-trainer/models/wesad_lstm/seq_30/model.onnx",
  60: "../../../../apps/model-trainer/models/wesad_lstm/seq_60/model.onnx",
  90: "../../../../apps/model-trainer/models/wesad_lstm/seq_90/model.onnx",
} as const;

type SequenceLength = (typeof SEQUENCE_LENGTHS)[number];

const sessionCache = new Map<SequenceLength, Promise<ort.InferenceSession>>();

function toFloat32Sequence(windowFeatures: number[][]): Float32Array {
  const values = new Float32Array(windowFeatures.length * FEATURE_COUNT);
  let offset = 0;

  for (const row of windowFeatures) {
    if (row.length !== FEATURE_COUNT) {
      throw new Error(`Expected ${FEATURE_COUNT} features per record`);
    }

    for (const value of row) {
      values[offset] = value;
      offset += 1;
    }
  }

  return values;
}

async function getSession(
  sequenceLength: SequenceLength
): Promise<ort.InferenceSession> {
  const cachedSession = sessionCache.get(sequenceLength);
  if (cachedSession) {
    return cachedSession;
  }

  const sessionPromise = (async () => {
    const response = await fetch(MODEL_PATHS[sequenceLength]);
    if (!response.ok) {
      throw new Error(
        `Failed to load ONNX model for sequence ${sequenceLength}`
      );
    }

    const modelBuffer = await response.arrayBuffer();
    return ort.InferenceSession.create(modelBuffer, {
      executionProviders: ["wasm"],
    });
  })();
  sessionCache.set(sequenceLength, sessionPromise);
  return sessionPromise;
}

async function predictSequenceProbability(
  sequenceLength: SequenceLength,
  windowFeatures: number[][]
): Promise<number> {
  if (windowFeatures.length !== sequenceLength) {
    throw new Error(`Expected a ${sequenceLength}-record window`);
  }

  const session = await getSession(sequenceLength);
  const input = new ort.Tensor("float32", toFloat32Sequence(windowFeatures), [
    1,
    sequenceLength,
    FEATURE_COUNT,
  ]);
  const outputs = await session.run({ input });
  const firstOutput = Object.values(outputs)[0];

  if (!firstOutput) {
    throw new Error("ONNX model returned no outputs");
  }

  return Number(firstOutput.data[0]);
}

export async function predictAllSequenceProbabilities(
  windowFeatures: number[][]
): Promise<{
  averageProbability: number;
  probabilities: Record<SequenceLength, number>;
}> {
  if (windowFeatures.length !== 90) {
    throw new Error("Expected the full 90-record window");
  }

  const probabilities = {
    30: await predictSequenceProbability(30, windowFeatures.slice(-30)),
    60: await predictSequenceProbability(60, windowFeatures.slice(-60)),
    90: await predictSequenceProbability(90, windowFeatures),
  } as const;

  const averageProbability =
    (probabilities[30] + probabilities[60] + probabilities[90]) / 3;

  return {
    averageProbability,
    probabilities,
  };
}

export function getSequenceMetadata(): {
  featureCount: number;
  sequenceLengths: readonly SequenceLength[];
  triggerWindowLength: number;
} {
  return {
    featureCount: FEATURE_COUNT,
    sequenceLengths: SEQUENCE_LENGTHS,
    triggerWindowLength: 90,
  };
}
