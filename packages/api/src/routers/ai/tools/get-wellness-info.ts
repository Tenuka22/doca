import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createGetWellnessInfoTool(_context: ClerkRequestContext) {
  return tool(
    async () =>
      JSON.stringify({
        activities: [
          "Breathing exercises",
          "Meditation",
          "Walking",
          "Stretching",
          "Journaling",
          "Gratitude",
        ],
      }),
    {
      name: "get_wellness_info",
      description: "Get wellness activities",
      schema: z.object({}).describe("No input needed"),
    }
  );
}
