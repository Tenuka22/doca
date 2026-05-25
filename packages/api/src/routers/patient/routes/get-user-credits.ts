import { userCredits } from "@zen-doc/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const getUserCreditsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const [credits] = await context.db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    return credits ?? { userId, balance: 0 };
  }
);
