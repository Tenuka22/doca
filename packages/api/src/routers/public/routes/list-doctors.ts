import {
  doctorFiles,
  doctorProfiles,
  doctorWeeklyAvailability,
  parseJsonApproachSteps,
  parseJsonStringArray,
} from "@doca/db";
import { listDoctorsInputSchema } from "@doca/db/schemas-types";
import { count, desc, eq } from "drizzle-orm";
import { publicProcedure } from "../../../index";

function mapDoctorProfile(profile: typeof doctorProfiles.$inferSelect) {
  return {
    ...profile,
    specialties: parseJsonStringArray(profile.specialties),
    languages: parseJsonStringArray(profile.languages),
    consultationModes: parseJsonStringArray(profile.consultationModes),
    focusAreas: parseJsonStringArray(profile.focusAreas),
    approachSteps: parseJsonApproachSteps(profile.approachSteps),
  };
}

export const listDoctorsRoute = publicProcedure
  .input(listDoctorsInputSchema)
  .handler(async ({ context, input }) => {
    const profiles = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.permanent, true))
      .orderBy(desc(doctorProfiles.createdAt));

    const rawSearch = input.search.toLowerCase().trim();
    const searchTerms = rawSearch ? rawSearch.split(/\s+/) : [];
    const filteredProfiles =
      searchTerms.length > 0
        ? profiles.filter((profile) => {
            const haystack = [
              profile.displayName,
              profile.headline,
              profile.location,
              profile.specialties,
              profile.languages,
              profile.focusAreas,
            ]
              .filter((value): value is string => typeof value === "string")
              .join(" ")
              .toLowerCase();

            return searchTerms.every((term) => haystack.includes(term));
          })
        : profiles;

    const offset = (input.page - 1) * input.pageSize;
    const pageItems = filteredProfiles.slice(offset, offset + input.pageSize);

    const doctors = await Promise.all(
      pageItems.map(async (profile) => {
        const [portrait] = await context.db
          .select()
          .from(doctorFiles)
          .where(eq(doctorFiles.doctorId, profile.userId))
          .limit(1);

        const [availabilityCount] = await context.db
          .select({ value: count() })
          .from(doctorWeeklyAvailability)
          .where(eq(doctorWeeklyAvailability.doctorId, profile.userId));

        return {
          profile: mapDoctorProfile(profile),
          portrait: portrait ?? null,
          hasAvailability: (availabilityCount?.value ?? 0) > 0,
        };
      })
    );

    return {
      doctors,
      page: input.page,
      pageSize: input.pageSize,
      total: filteredProfiles.length,
      hasMore: offset + input.pageSize < filteredProfiles.length,
    };
  });

