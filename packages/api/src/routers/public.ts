import {
  doctorEducationEntries,
  doctorFiles,
  doctorProfiles,
  parseJsonApproachSteps,
  parseJsonStringArray,
} from "@zen-doc/db";
import { listDoctorsInputSchema } from "@zen-doc/db/schemas-types";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";

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

export const publicRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    userId: context.auth?.userId,
  })),
  listDoctors: publicProcedure
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

      const doctors = await Promise.all(
        pageItems.map(async (profile) => {
          const [portrait] = await context.db
            .select()
            .from(doctorFiles)
            .where(eq(doctorFiles.doctorId, profile.userId))
            .limit(1);

          return {
            profile: mapDoctorProfile(profile),
            portrait: portrait ?? null,
          };
        })
      );

      return {
        doctors,
        page: input.page,
        pageSize: input.pageSize,
        hasMore: offset + input.pageSize < filteredProfiles.length,
      };
    }),
  getDoctor: publicProcedure
    .input(z.object({ doctorId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const [profile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, input.doctorId))
        .limit(1);

      if (!profile) {
        return null;
      }

      const [portrait] = await context.db
        .select()
        .from(doctorFiles)
        .where(eq(doctorFiles.doctorId, profile.userId))
        .limit(1);

      const files = await context.db
        .select()
        .from(doctorFiles)
        .where(eq(doctorFiles.doctorId, profile.userId));

      const education = await context.db
        .select()
        .from(doctorEducationEntries)
        .where(eq(doctorEducationEntries.doctorId, profile.userId));

      return {
        profile: mapDoctorProfile(profile),
        portrait: portrait ?? null,
        files,
        education,
      };
    }),
};
