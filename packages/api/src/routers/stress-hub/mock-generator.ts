export function generateMockHRVFeatures(): [
  number,
  number,
  number,
  number,
  number,
] {
  const meanRr = 700 + Math.random() * 300;
  const sdnn = 30 + Math.random() * 50;
  const rmssd = 20 + Math.random() * 40;
  const pnn50 = Math.random() * 30;
  const hr = 60_000 / meanRr;

  return [
    Math.round(meanRr * 100) / 100,
    Math.round(sdnn * 100) / 100,
    Math.round(rmssd * 100) / 100,
    Math.round(pnn50 * 100) / 100,
    Math.round(hr * 100) / 100,
  ];
}
