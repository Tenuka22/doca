export const FEATURE_NAMES = [
  "MEAN_RR",
  "MEDIAN_RR",
  "SDRR",
  "RMSSD",
  "SDSD",
  "SDRR_RMSSD",
  "HR",
  "pNN25",
  "pNN50",
  "SD1",
  "SD2",
] as const;

export const N_FEATURES = 11;

export function expandTo11Features(incoming: number[]): number[] {
  const meanRr = incoming[0] ?? 750;
  const sdnn = incoming[1] ?? 50;
  const rmssd = incoming[2] ?? 30;
  const pnn50 = incoming[3] ?? 15;
  const hr = incoming[4] ?? 75;

  const medianRr = meanRr * 0.98;
  const sdsd = rmssd * 0.95;
  const sdnnRmssdRatio = sdnn / Math.max(rmssd, 0.001);
  const pnn25 = pnn50 * 2.5;
  const sd1 = rmssd / Math.SQRT2;
  const sd2 = Math.sqrt(Math.max(0, 2 * sdnn * sdnn - sd1 * sd1));

  return [
    meanRr,
    medianRr,
    sdnn,
    rmssd,
    sdsd,
    sdnnRmssdRatio,
    hr,
    pnn25,
    pnn50,
    sd1,
    sd2,
  ];
}

export function clampToValidRanges(features: number[]): number[] {
  const ranges: [number, number][] = [
    [300, 1500],
    [300, 1500],
    [10, 200],
    [5, 150],
    [5, 150],
    [0.5, 5],
    [30, 180],
    [0, 100],
    [0, 100],
    [5, 150],
    [5, 200],
  ];

  return features.map((v, i) => {
    const [lo, hi] = ranges[i] ?? [
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ];
    return Math.max(lo, Math.min(hi, v));
  });
}
