import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const startSimulationRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    return { startedAt: Date.now(), userId };
  }
);
