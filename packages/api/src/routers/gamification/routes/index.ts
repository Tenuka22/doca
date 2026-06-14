import {
  moonlightCredits,
  moonlightCreditTransactions,
  spriteStates,
  wellnessActions,
} from "@doca/db";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

const ACTION_TYPES = [
  "breathing_morning",
  "breathing_evening",
  "breathing_night",
  "meditation_morning",
  "meditation_evening",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

interface TaskTemplate {
  actionType: ActionType;
  descriptions: string[];
  maxCycles: number;
  minCycles: number;
  timeSlot: "morning" | "afternoon" | "night";
  titles: string[];
}

const TASK_POOL: TaskTemplate[] = [
  {
    actionType: "breathing_morning",
    timeSlot: "morning",
    titles: ["Breath Rhythm", "Morning Wake-Up", "Sunrise Breath", "Dew Drops"],
    descriptions: [
      "Start your day calm and centered with a guided breathing rhythm.",
      "Wake up your lungs with invigorating morning breathwork.",
      "Synchronize your breath with the rising sun.",
      "Gentle breathing to greet the new day.",
    ],
    minCycles: 3,
    maxCycles: 6,
  },
  {
    actionType: "meditation_morning",
    timeSlot: "morning",
    titles: [
      "Morning Meditation",
      "Mindful Start",
      "Dawn Stillness",
      "Morning Calm",
    ],
    descriptions: [
      "Set your intention for the day with a short morning meditation.",
      "Quiet the mind before the day begins.",
      "Find your center in the stillness of dawn.",
      "A moment of peace to start your day right.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "breathing_evening",
    timeSlot: "afternoon",
    titles: [
      "Afternoon Reset",
      "Midday Breath",
      "Afternoon Pause",
      "Solar Rhythm",
    ],
    descriptions: [
      "Reset your focus with an afternoon breathing exercise.",
      "Break up your day with a mindful breathing pause.",
      "Recharge your energy with midday breathwork.",
      "A breath of fresh air for your afternoon slump.",
    ],
    minCycles: 3,
    maxCycles: 5,
  },
  {
    actionType: "meditation_evening",
    timeSlot: "afternoon",
    titles: [
      "Afternoon Mindfulness",
      "Midday Meditation",
      "Afternoon Stillness",
      "Solar Calm",
    ],
    descriptions: [
      "Release built-up tension with a short afternoon meditation.",
      "Find clarity in the middle of your day.",
      "A mindful pause to carry you through the afternoon.",
      "Center yourself before the evening rush.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
  {
    actionType: "breathing_night",
    timeSlot: "night",
    titles: [
      "Night Calm",
      "Sleepy Breath",
      "Moonlight Rhythm",
      "Starry Breath",
    ],
    descriptions: [
      "Deep breathing to wind down for a restful night's sleep.",
      "Let go of the day with calming night breathwork.",
      "Breathe easy under the moonlight.",
      "Gentle breathing to guide you into slumber.",
    ],
    minCycles: 3,
    maxCycles: 6,
  },
  {
    actionType: "meditation_evening",
    timeSlot: "night",
    titles: [
      "Evening Meditation",
      "Dusk Stillness",
      "Night Reflection",
      "Moonlight Calm",
    ],
    descriptions: [
      "Release the day's tension with a calming evening meditation.",
      "Quiet reflection as the day comes to a close.",
      "Find peace in the quiet of the evening.",
      "Let the moonlight guide your meditation.",
    ],
    minCycles: 1,
    maxCycles: 1,
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

const calculateConsistencyBonus = (streakDays: number): number => {
  if (streakDays >= 30) {
    return 50;
  }
  if (streakDays >= 14) {
    return 30;
  }
  if (streakDays >= 7) {
    return 20;
  }
  if (streakDays >= 3) {
    return 10;
  }
  return 5;
};

export const getSpriteStateRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    let [state] = await context.db
      .select()
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    if (!state) {
      await context.db.insert(spriteStates).values({
        userId,
        health: 100,
        mood: "idle",
        streakDays: 0,
      });
      [state] = await context.db
        .select()
        .from(spriteStates)
        .where(eq(spriteStates.userId, userId))
        .limit(1);
    }

    if (!state) {
      return {
        userId,
        health: 100,
        mood: "idle" as const,
        streakDays: 0,
        lastInteractionAt: null,
        createdAt: "",
        updatedAt: "",
      };
    }

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const [actionCount] = await context.db
      .select({ count: count() })
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, sevenDaysAgo)
        )
      );
    const health = Math.max(
      0,
      Math.min(100, 40 + (actionCount?.count ?? 0) * 10)
    );

    let mood: "idle" | "sleep" | "yawn" | "happy" | "sad" = state.mood;
    if (health > 80) {
      mood = "happy";
    } else if (health < 30) {
      mood = "sad";
    } else if (health < 50) {
      mood = "yawn";
    }

    if (health !== state.health || mood !== state.mood) {
      await context.db
        .update(spriteStates)
        .set({ health, mood, updatedAt: new Date().toISOString() })
        .where(eq(spriteStates.userId, userId));
      state = { ...state, health, mood };
    }

    return state;
  }
);

export const getTodayTasksRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);
    const now = new Date();
    const hour = now.getHours();
    const daySeed =
      now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();

    let timeOfDay: "morning" | "afternoon" | "night";
    let slotTemplates: TaskTemplate[];

    if (hour >= 5 && hour < 12) {
      timeOfDay = "morning";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "morning");
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "afternoon");
    } else {
      timeOfDay = "night";
      slotTemplates = TASK_POOL.filter((t) => t.timeSlot === "night");
    }

    const rand = seededRandom(daySeed + timeOfDay.length);

    const today = now.toISOString().split("T")[0];
    const todayActions = await context.db
      .select()
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, `${today}T00:00:00Z`)
        )
      );
    const completedSet = new Set(todayActions.map((a) => a.actionType));

    const tasks = slotTemplates.map((t) => {
      const requiredCycles =
        t.minCycles + Math.floor(rand() * (t.maxCycles - t.minCycles + 1));
      const titleIdx = Math.floor(rand() * t.titles.length);
      const descIdx = Math.floor(rand() * t.descriptions.length);

      return {
        actionType: t.actionType,
        timeSlot: t.timeSlot,
        title: t.titles[titleIdx] ?? t.titles[0]!,
        description: t.descriptions[descIdx] ?? t.descriptions[0]!,
        requiredCycles,
        completed: completedSet.has(t.actionType),
        credits: 10,
      };
    });

    return { timeOfDay, tasks };
  }
);

export const completeWellnessActionRoute = protectedProcedure
  .input(
    z.object({
      actionType: z.enum(ACTION_TYPES),
      durationSeconds: z.number().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);
    const { actionType, durationSeconds } = input;

    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const existingToday = await context.db
      .select()
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          eq(wellnessActions.actionType, actionType),
          gte(wellnessActions.completedAt, `${today}T00:00:00Z`)
        )
      )
      .limit(1);

    if (existingToday.length > 0) {
      throw new Error(
        "Action already completed today. Come back tomorrow for consistency rewards!"
      );
    }

    const [streakResult] = await context.db
      .select({ streakDays: spriteStates.streakDays })
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    const streakDays = streakResult?.streakDays ?? 0;
    const consistencyBonus = calculateConsistencyBonus(streakDays);
    const baseCredits = 10;
    const totalCredits = baseCredits + consistencyBonus;

    await context.db.insert(wellnessActions).values({
      id: crypto.randomUUID(),
      userId,
      actionType,
      completedAt: now,
      durationSeconds,
      creditsEarned: totalCredits,
    });

    const [existingCredits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, userId))
      .limit(1);

    if (existingCredits) {
      await context.db
        .update(moonlightCredits)
        .set({
          balance: existingCredits.balance + totalCredits,
          totalEarned: existingCredits.totalEarned + totalCredits,
          updatedAt: now,
        })
        .where(eq(moonlightCredits.userId, userId));
    } else {
      await context.db.insert(moonlightCredits).values({
        userId,
        balance: totalCredits,
        totalEarned: totalCredits,
        consistencyScore: streakDays,
      });
    }

    await context.db.insert(moonlightCreditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: totalCredits,
      type: "earned",
      reason: `Completed ${actionType}`,
    });

    const newStreak = streakDays + 1;
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const [actionCount] = await context.db
      .select({ count: count() })
      .from(wellnessActions)
      .where(
        and(
          eq(wellnessActions.userId, userId),
          gte(wellnessActions.completedAt, sevenDaysAgo)
        )
      );
    const health = Math.max(
      0,
      Math.min(100, 40 + (actionCount?.count ?? 0) * 10)
    );

    const [existingSprite] = await context.db
      .select()
      .from(spriteStates)
      .where(eq(spriteStates.userId, userId))
      .limit(1);

    if (existingSprite) {
      await context.db
        .update(spriteStates)
        .set({
          streakDays: newStreak,
          health,
          lastInteractionAt: now,
          updatedAt: now,
        })
        .where(eq(spriteStates.userId, userId));
    } else {
      await context.db.insert(spriteStates).values({
        userId,
        health,
        streakDays: newStreak,
        lastInteractionAt: now,
      });
    }

    return {
      success: true,
      creditsEarned: totalCredits,
      streakDays: newStreak,
      mood: health > 80 ? "happy" : health < 30 ? "sad" : "idle",
    };
  });

export const getMoonlightCreditsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(moonlightCredits)
      .where(eq(moonlightCredits.userId, userId))
      .limit(1);

    return (
      credits ?? {
        userId,
        balance: 0,
        totalEarned: 0,
        consistencyScore: 0,
      }
    );
  }
);

export const getWellnessHistoryRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const history = await context.db
      .select()
      .from(wellnessActions)
      .where(eq(wellnessActions.userId, userId))
      .orderBy(desc(wellnessActions.completedAt));

    return history;
  }
);

export const getRecentTransactionsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const transactions = await context.db
      .select()
      .from(moonlightCreditTransactions)
      .where(eq(moonlightCreditTransactions.userId, userId))
      .orderBy(desc(moonlightCreditTransactions.createdAt))
      .limit(20);

    return transactions;
  }
);
