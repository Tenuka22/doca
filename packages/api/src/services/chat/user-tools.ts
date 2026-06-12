import { type ToolRuntime, tool } from "@langchain/core/tools";

import {
  moonlightCredits as moonlightCreditsTable,
  patientProfiles as patientProfilesTable,
  spriteStates as spriteStatesTable,
  wellnessActions as wellnessActionsTable,
} from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { getAllDoctorsContext } from "./doctor-tools";

export type DbClient = ReturnType<typeof import("@zen-doc/db").createDb>;

export interface UserContext {
  db: DbClient;
  userId: string;
}

function getCtx(runtime: ToolRuntime): UserContext {
  const config = runtime.config?.configurable as
    | Record<string, unknown>
    | undefined;
  const userId = config?.userId as string | undefined;
  const db = config?.db as DbClient | undefined;
  if (!(userId && db)) {
    throw new Error("User not authenticated or db is not provided");
  }
  return { userId, db };
}

export async function getPatientProfile(ctx: UserContext) {
  const profile = await ctx.db.query.patientProfiles.findFirst({
    where: eq(patientProfilesTable.userId, ctx.userId),
  });
  if (!profile) {
    return null;
  }
  return {
    name: "getPatientProfile",
    data: {
      alias: profile.alias,
      hasGuardian: !!profile.guardianUserId,
      guardianRequestStatus: profile.guardianRequestStatus,
      isOnboardingComplete: profile.isOnboardingComplete,
    },
  };
}

export async function getSpriteState(ctx: UserContext) {
  const sprite = await ctx.db.query.spriteStates.findFirst({
    where: eq(spriteStatesTable.userId, ctx.userId),
  });
  if (!sprite) {
    return null;
  }
  return {
    name: "getSpriteState",
    data: {
      health: sprite.health,
      mood: sprite.mood,
      streakDays: sprite.streakDays,
    },
  };
}

export async function getWellnessCredits(ctx: UserContext) {
  const credits = await ctx.db.query.moonlightCredits.findFirst({
    where: eq(moonlightCreditsTable.userId, ctx.userId),
  });
  if (!credits) {
    return null;
  }
  return {
    name: "getWellnessCredits",
    data: {
      balance: credits.balance,
      totalEarned: credits.totalEarned,
      consistencyScore: credits.consistencyScore,
    },
  };
}

export async function getRecentWellnessActions(ctx: UserContext) {
  const actions = await ctx.db.query.wellnessActions.findMany({
    where: eq(wellnessActionsTable.userId, ctx.userId),
    orderBy: (actions, { desc }) => [desc(actions.completedAt)],
    limit: 5,
  });
  if (!actions.length) {
    return null;
  }
  return {
    name: "getRecentWellnessActions",
    data: actions.map((a) => ({
      actionType: a.actionType,
      completedAt: a.completedAt,
      durationSeconds: a.durationSeconds,
      creditsEarned: a.creditsEarned,
    })),
  };
}

export async function getUpcomingAppointments(ctx: UserContext) {
  const sessions = await ctx.db.query.doctorSessions.findMany({
    where: (s, { and, gte }) =>
      and(
        eq(s.patientId, ctx.userId),
        gte(s.startAt, new Date().toISOString())
      ),
    orderBy: (s, { asc }) => [asc(s.startAt)],
    limit: 5,
  });
  if (!sessions.length) {
    return null;
  }

  const doctorIds = [...new Set(sessions.map((s) => s.doctorId))];
  const doctors = await ctx.db.query.doctorProfiles.findMany({
    where: (d, { inArray }) => inArray(d.userId, doctorIds),
  });

  const doctorMap = new Map(doctors.map((d) => [d.userId, d.displayName]));

  return {
    name: "getUpcomingAppointments",
    data: sessions.map((s) => ({
      id: s.id,
      startAt: s.startAt,
      status: s.status,
      doctorName: doctorMap.get(s.doctorId) || "Unknown Doctor",
    })),
  };
}

export async function getPastAppointments(ctx: UserContext) {
  const sessions = await ctx.db.query.doctorSessions.findMany({
    where: (s, { and, lt }) =>
      and(eq(s.patientId, ctx.userId), lt(s.startAt, new Date().toISOString())),
    orderBy: (s, { desc }) => [desc(s.startAt)],
    limit: 5,
  });
  if (!sessions.length) {
    return null;
  }
  return {
    name: "getPastAppointments",
    data: sessions.map((s) => ({
      id: s.id,
      startAt: s.startAt,
      status: s.status,
      doctorId: s.doctorId,
    })),
  };
}

export const patientProfileGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getPatientProfile(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No patient profile found";
  },
  {
    name: "get_patient_profile",
    description:
      "Get the current user's patient profile: alias, guardian status, and onboarding completion status",
    schema: z.object({}),
  }
);

export const spriteStateGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getSpriteState(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No sprite state found";
  },
  {
    name: "get_sprite_state",
    description:
      "Get the current user's Sprite wellness companion state: health, mood, and streak days",
    schema: z.object({}),
  }
);

export const wellnessCreditsGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getWellnessCredits(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No wellness credits found";
  },
  {
    name: "get_wellness_credits",
    description:
      "Get the current user's moonlight wellness credits: balance, total earned, and consistency score",
    schema: z.object({}),
  }
);

export const recentWellnessActionsGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getRecentWellnessActions(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No recent wellness actions";
  },
  {
    name: "get_recent_wellness_actions",
    description:
      "Get the current user's last 5 wellness actions (breathing exercises, meditations) with duration and credits earned",
    schema: z.object({}),
  }
);

export const upcomingAppointmentsGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getUpcomingAppointments(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No upcoming appointments";
  },
  {
    name: "get_upcoming_appointments",
    description:
      "Get the current user's upcoming doctor appointments with dates and status",
    schema: z.object({}),
  }
);

export const pastAppointmentsGetTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const ctx = getCtx(runtime);
    const result = await getPastAppointments(ctx);
    return result
      ? JSON.stringify(result.data, null, 2)
      : "No past appointments";
  },
  {
    name: "get_past_appointments",
    description:
      "Get the current user's past doctor appointments and their status (requested, confirmed, completed, cancelled)",
    schema: z.object({}),
  }
);

export const getDoctorsTool = tool(
  async (_input: Record<string, never>, runtime: ToolRuntime) => {
    const config = runtime.config?.configurable as
      | Record<string, unknown>
      | undefined;
    const doctorEmbeddingsKv = config?.doctorEmbeddingsKv as
      | KVNamespace
      | undefined;
    if (!doctorEmbeddingsKv) {
      throw new Error("doctorEmbeddingsKv not available");
    }
    const result = (await getAllDoctorsContext(doctorEmbeddingsKv)) || "No doctors found";
    console.log("getDoctorsTool:result", { length: result.length, startsWith: result.slice(0, 100) });
    return result;
  },
  {
    name: "get_doctors",
    description:
      "Get all available doctor profiles with their specialties, focus areas, bios, approach, and consultation info. Use this when the user asks about finding a doctor, therapist, or specialist.",
    schema: z.object({}),
  }
);

export const getDoctorDetailsTool = tool(
  async (input: { doctorId: string }, runtime: ToolRuntime) => {
    const config = runtime.config?.configurable as
      | Record<string, unknown>
      | undefined;
    const db = config?.db as DbClient | undefined;
    if (!db) {
      throw new Error("db not available");
    }

    const doctorProfile = await db.query.doctorProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, input.doctorId),
    });

    if (!doctorProfile) {
      return "Doctor not found";
    }

    const specialties = doctorProfile.specialties
      ? JSON.parse(doctorProfile.specialties)
      : [];
    const focusAreas = doctorProfile.focusAreas
      ? JSON.parse(doctorProfile.focusAreas)
      : [];
    const languages = doctorProfile.languages
      ? JSON.parse(doctorProfile.languages)
      : [];
    const consultationModes = doctorProfile.consultationModes
      ? JSON.parse(doctorProfile.consultationModes)
      : [];

    return JSON.stringify(
      {
        userId: doctorProfile.userId,
        name: doctorProfile.displayName,
        headline: doctorProfile.headline,
        bio: doctorProfile.bio,
        approach: doctorProfile.approach,
        specialties,
        focusAreas,
        languages,
        consultationModes,
        location: doctorProfile.location,
        experienceStartYear: doctorProfile.experienceStartYear,
      },
      null,
      2
    );
  },
  {
    name: "get_doctor_details",
    description:
      "Get detailed information about a specific doctor by their ID (user_xxx format). Returns full bio, approach, specialties, and other details. Use this when you need more information about a doctor from appointments or doctor list.",
    schema: z.object({
      doctorId: z
        .string()
        .describe(
          "The doctor's user ID (e.g., user_3DE1SwXbGDhLhxoELQvdBfFEiLi)"
        ),
    }),
  }
);

export const tools = [
  patientProfileGetTool,
  spriteStateGetTool,
  wellnessCreditsGetTool,
  recentWellnessActionsGetTool,
  upcomingAppointmentsGetTool,
  pastAppointmentsGetTool,
  getDoctorsTool,
  getDoctorDetailsTool,
];
