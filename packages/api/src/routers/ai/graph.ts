import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { ClerkRequestContext } from "../../context";
import {
  createCoordinatorNode,
  createDbAgentNode,
  createGeneralAgentNode,
  createRouter,
} from "./nodes";
import { createAiTools } from "./tools";

const PROMPTS: Record<string, string> = {
  coordinator: `You are a medical assistant coordinator. Route user queries to the right agent.

Agents:
- db: Doctor search, profiles, appointments, availability
- general: Wellness tips, stress management, general Q&A

Use transfer_to_agent tool to route. For simple greetings, answer directly.`,
  db: "You are a database assistant. Help users find doctors, view profiles, check availability, and manage appointments. Use your tools to query information.",
  general:
    "You are a wellness assistant. Provide helpful tips on stress management, wellness activities, and general health advice. Be supportive and encouraging.",
};

// ── Key rotation ──

let keyIndex = 0;
const keyPool: string[] = [];

export function initKeys(keys: string) {
  keyPool.length = 0;
  keyPool.push(
    ...keys
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  );
  keyIndex = 0;
}

function nextKey(): string {
  if (keyPool.length === 0) {
    return "";
  }
  const key = keyPool[keyIndex % keyPool.length];
  keyIndex = (keyIndex + 1) % keyPool.length;
  return key ?? "";
}

// ── Graph ──

export function createGraph(ctx: ClerkRequestContext) {
  if (keyPool.length === 0) {
    initKeys(ctx.geminiApiKey ?? "");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: nextKey(),
    temperature: 0.3,
    maxRetries: 2,
  });

  const tools = createAiTools(ctx);
  const allTools = Object.values(tools).filter(
    (t): t is NonNullable<typeof t> => t != null
  );
  const toolNode = new ToolNode(allTools);
  const config = { llm, toolNode, systemPrompts: PROMPTS, tools };

  return new StateGraph(MessagesAnnotation)
    .addNode("coordinator", createCoordinatorNode(config))
    .addNode("db", createDbAgentNode(config))
    .addNode("general", createGeneralAgentNode(config))
    .addNode("tools", toolNode)
    .addEdge("__start__", "coordinator")
    .addConditionalEdges("coordinator", createRouter(config))
    .addEdge("db", "coordinator")
    .addEdge("general", "coordinator")
    .addEdge("tools", "coordinator")
    .compile();
}

export interface StreamEvent {
  data: Record<string, unknown>;
  event:
    | "message.start"
    | "message.token"
    | "message.tool_call"
    | "message.tool_result"
    | "message.end"
    | "message.error";
}

export async function* runAgentStream(
  ctx: ClerkRequestContext,
  userMessage: string
): AsyncGenerator<StreamEvent> {
  const graph = createGraph(ctx);
  let lastContent = "";
  let agent = "coordinator";

  try {
    const stream = await graph.stream({
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const update of stream) {
      for (const [node, data] of Object.entries(update) as Array<
        [
          string,
          {
            messages?: Array<{
              content: string;
              tool_calls?: Array<{ name: string }>;
            }>;
          },
        ]
      >) {
        agent = node;
        const msgs = data?.messages ?? [];
        for (const msg of msgs) {
          if (msg.tool_calls?.length) {
            for (const tc of msg.tool_calls) {
              yield {
                event: "message.tool_call",
                data: { tool: tc.name, agent: node },
              };
            }
          }
          const content = typeof msg.content === "string" ? msg.content : "";
          if (content && content !== lastContent) {
            const delta = content.slice(lastContent.length);
            if (delta) {
              yield {
                event: "message.token",
                data: { token: delta, agent: node },
              };
            }
            lastContent = content;
          }
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    yield { event: "message.error", data: { error: msg, agent } };
    return;
  }
}
