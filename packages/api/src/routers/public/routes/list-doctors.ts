import {
  doctorFiles,
  doctorProfiles,
  doctorScheduleEntries,
  doctorSessions,
  parseJsonApproachSteps,
  parseJsonStringArray,
} from "@zen-doc/db";
import { listDoctorsInputSchema } from "@zen-doc/db/schemas-types";
import { and, count, desc, eq, gte, lte, or } from "drizzle-orm";
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
      .orderBy(desc(doctorProfiles.createdAt));

    const search = input.search.toLowerCase();
    const filteredProfiles = search
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

          return haystack.includes(search);
        })
      : profiles;

    const offset = (input.page - 1) * input.pageSize;
    const pageItems = filteredProfiles.slice(offset, offset + input.pageSize);

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const doctors = await Promise.all(
      pageItems.map(async (profile) => {
        const [portrait] = await context.db
          .select()
          .from(doctorFiles)
          .where(eq(doctorFiles.doctorId, profile.userId))
          .limit(1);

        // Count available slots (open or cancelled sessions)
        const [availableSlots] = await context.db
          .select({ value: count() })
          .from(doctorScheduleEntries)
          .leftJoin(
            doctorSessions,
            eq(doctorScheduleEntries.sessionId, doctorSessions.id)
          )
          .where(
            and(
              eq(doctorScheduleEntries.doctorId, profile.userId),
              gte(doctorScheduleEntries.startAt, now.toISOString()),
              lte(doctorScheduleEntries.endAt, next7Days.toISOString()),
              or(
                eq(doctorScheduleEntries.kind, "open"),
                and(
                  eq(doctorScheduleEntries.kind, "session"),
                  eq(doctorSessions.status, "cancelled")
                )
              )
            )
          );

        return {
          profile: mapDoctorProfile(profile),
          portrait: portrait ?? null,
          availableSlotCount: availableSlots?.value ?? 0,
        };
      })
    );

    return {
      doctors,
      page: input.page,
      pageSize: input.pageSize,
      hasMore: offset + input.pageSize < filteredProfiles.length,
    };
  });
