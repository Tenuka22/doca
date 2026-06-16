import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ClerkRequestContext } from "../../../context";

export function createTransferToAgentTool(_context: ClerkRequestContext) {
  return tool(
    async ({ agent }: { agent: string }) =>
      JSON.stringify({ transferred: true, agent }),
    {
      name: "transfer_to_agent",
      description: "Transfer to a specialized agent",
      schema: z.object({
        agent: z.enum(["db", "general"]).describe("Agent to transfer to"),
      }),
    }
  );
}
