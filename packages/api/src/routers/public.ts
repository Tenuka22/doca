import { protectedProcedure, publicProcedure } from "../index";

export const publicRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    userId: context.auth?.userId,
  })),
};
