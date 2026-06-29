import { users } from "@suwa/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const setOnboardingRoleRoute = protectedProcedure
  .input(z.object({ role: z.enum(["tenant-admin", "pending-doctor"]) }))
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    await context.db
      .update(users)
      .set({ role: input.role })
      .where(eq(users.id, userId));

    return { success: true };
  });
