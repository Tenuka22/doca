import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

export const stopSimulationRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    return { stopped: true, userId };
  }
);
