

export async function getAllDoctorsContext(doctorEmbeddingsKv: KVNamespace): Promise<string> {
  const { keys } = await doctorEmbeddingsKv.list({ prefix: "doctors/" })

  if (!keys.length) {
    console.log("getAllDoctorsContext:no-keys")
    return ""
  }

  const doctors = []
  for (const key of keys) {
    const stored = await doctorEmbeddingsKv.get(key.name, "text")
    if (stored) {
      try {
        doctors.push(JSON.parse(stored))
      } catch {
        console.log("getAllDoctorsContext:parse-error", { key: key.name })
        continue
      }
    }
  }

  if (!doctors.length) {
    console.log("getAllDoctorsContext:no-doctors-after-parse")
    return ""
  }

  const sampleEntry = doctors[0]
  console.log("getAllDoctorsContext:sample", {
    count: doctors.length,
    keys: doctors.map((d) => d.userId),
    hasEmbedding: Array.isArray(sampleEntry?.embedding),
    embeddingLength: sampleEntry?.embedding?.length,
    sampleKeys: Object.keys(sampleEntry),
  })

  const documents = doctors
    .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
    .map((d) => JSON.stringify(d))

  const joined = documents.join("\n\n---\n\n")
  console.log("getAllDoctorsContext:returning", { totalLength: joined.length, firstChars: joined.slice(0, 200) })

  return joined
}
