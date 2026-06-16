import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createGetStressTipsTool(_context: ClerkRequestContext) {
  return tool(
    async () =>
      JSON.stringify({
        tips: [
          "Deep breathing for 2 min",
          "10-min walk",
          "Progressive muscle relaxation",
          "Write 3 gratitudes",
          "Screen break",
        ],
      }),
    {
      name: "get_stress_tips",
      description: "Get stress management tips",
      schema: z.object({}).describe("No input needed"),
    }
  );
}
