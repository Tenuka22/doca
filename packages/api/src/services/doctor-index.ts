import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare"
import { env } from "@zen-doc/env/server"

export interface DoctorInfo {
  userId: string
  displayName: string | null
  headline: string | null
  specialties: string[]
  focusAreas: string[]
  languages: string[]
  consultationModes: string[]
  location: string | null
  experienceStartYear: number | null
}

export interface DoctorProfile extends DoctorInfo {
  bio: string | null
  approach: string | null
  approachSteps: { id: string; text: string }[]
  education: string | null
}

interface DoctorEmbeddingEntry extends DoctorInfo {
  embedding: number[]
}

function calcYearsExperience(experienceStartYear: number | null): number | null {
  if (!experienceStartYear) return null
  return Math.max(0, new Date().getFullYear() - experienceStartYear)
}

function fmt(label: string, value: string): string {
  return `**${label}:** ${value}`
}

export function buildDoctorDocument(profile: DoctorProfile): string {
  const detailLines = [
    profile.specialties.length > 0 ? fmt("Specialties", profile.specialties.join(", ")) : null,
    profile.focusAreas.length > 0 ? fmt("Focus Areas", profile.focusAreas.join(", ")) : null,
    profile.languages.length > 0 ? fmt("Languages", profile.languages.join(", ")) : null,
    profile.consultationModes.length > 0 ? fmt("Consultation Modes", profile.consultationModes.join(", ")) : null,
    profile.location ? fmt("Location", profile.location) : null,
    calcYearsExperience(profile.experienceStartYear) !== null
      ? fmt("Experience", `${calcYearsExperience(profile.experienceStartYear)} years (since ${profile.experienceStartYear})`)
      : null,
  ].filter((s): s is string => typeof s === "string")

  const sections = [
    `# ${profile.displayName ?? "Doctor"}`,
    "",
    profile.headline ? `**Headline:** ${profile.headline}` : null,
    profile.headline ? "" : null,
    profile.bio ? `## About\n\n${profile.bio}` : null,
    profile.bio ? "" : null,
    ...detailLines,
    profile.approach ? `## Approach\n\n${profile.approach}` : null,
    profile.approach ? "" : null,
    profile.approachSteps.length > 0 ? "## Approach Steps" : null,
    ...profile.approachSteps.map((s) => `- ${s.text}`),
  ]

  return sections.filter((s): s is string => s !== null).join("\n")
}

export async function indexDoctorProfile(profile: DoctorProfile): Promise<void> {
  const document = buildDoctorDocument(profile)
  const [embedding] = await
     new CloudflareWorkersAIEmbeddings({
      binding: env.AI,
      model: "@cf/baai/bge-small-en-v1.5",
    })
    .embedDocuments([document])

  const entry: DoctorEmbeddingEntry = {
    embedding: embedding ?? [],
    ...profile,
  }

  await env.DOCTOR_EMBEDDINGS_KV.put(
    `doctors/${profile.userId}`,
    JSON.stringify(entry),
    {
      metadata: {
        displayName: profile.displayName ?? "",
        specialties: profile.specialties.join(","),
        focusAreas: profile.focusAreas.join(","),
      },
    }
  )
}

export async function removeDoctorIndex(userId: string): Promise<void> {
  await env.DOCTOR_EMBEDDINGS_KV.delete(`doctors/${userId}`)
}
