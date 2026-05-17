import type { DoctorProfile } from "@zen-doc/db";
import { doctorProfiles } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const doctorRouter = {
  doctorProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) {
      return { profile: null, role: null };
    }

    const [profile] = await context.db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);
    const role = context.auth?.sessionClaims?.metadata?.role ?? "user";

    return { profile: profile ?? null, role };
  }),
  saveDoctorProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        licenseNumber: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.auth?.userId;
      if (!userId) {
        throw new Error("Missing user");
      }

      const currentRole = context.auth?.sessionClaims?.metadata?.role;
      const nextRole =
        currentRole === "admin" || currentRole === "doctor"
          ? currentRole
          : "pending-doctor";
      const timestamp = new Date().toISOString();
      const [existingProfile] = await context.db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, userId))
        .limit(1);

      const profile: DoctorProfile = {
        userId,
        bio: input.bio ?? null,
        licenseNumber: input.licenseNumber ?? null,
        permanent: existingProfile?.permanent ?? false,
        createdAt: existingProfile?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      await context.db
        .insert(doctorProfiles)
        .values(profile)
        .onConflictDoUpdate({
          target: doctorProfiles.userId,
          set: profile,
        });

      await context.clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: nextRole,
        },
      });

      return { ok: true, role: nextRole, profile };
    }),
};
