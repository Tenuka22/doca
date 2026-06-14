import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ClerkRequestContext } from "../../../../context";
import type { Suggestion } from "../chat-systems";
import { createDoctorTools } from "./tools";

export interface AgentResult {
  content: string;
  suggestions: Suggestion[];
}

const SUGGESTIONS_RE = /SUGGESTIONS:(\[[\s\S]*?\])\s*$/;

function parseSuggestions(content: string): AgentResult {
  const match = content.match(SUGGESTIONS_RE);
  if (!match || match.index === undefined) {
    return { content, suggestions: [] };
  }
  const json = match[1];
  if (!json) {
    return { content, suggestions: [] };
  }
  try {
    const suggestions = JSON.parse(json) as Suggestion[];
    return {
      content: content.slice(0, match.index).trim(),
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 6) : [],
    };
  } catch {
    return { content, suggestions: [] };
  }
}

async function generateSuggestions(
  context: ClerkRequestContext,
  history: Array<{ role: string; content: string }>
): Promise<Suggestion[]> {
  const conversationSummary = history
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const response = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
    messages: [
      {
        role: "user",
        content:
          `You generate follow-up suggestions for a medical assistant chat. Return ONLY a JSON array of objects with 'label', 'value', and 'description' fields. No other text. Example: [{"label":"Find a cardiologist","value":"find cardiologist","description":"Search for heart specialists"}]\n\nBased on this conversation, generate 3-4 follow-up options:\n\n${conversationSummary}`,
      },
    ],
  });

  const text = ((response as Record<string, unknown>).result as Record<string, unknown> | undefined)
    ?.response as string | undefined;

  if (!text) {
    return [];
  }

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 6) as Suggestion[];
    }
  } catch {
    // fall through to fallback
  }

  return [
    { label: "Find a doctor", value: "I need to find a doctor", description: "Search for doctors by name or specialty" },
    { label: "Get doctor info", value: "Tell me about a doctor", description: "Learn more about a specific doctor" },
    { label: "Browse specialties", value: "What specialties are available?", description: "See available medical specialties" },
  ];
}

export async function runDoctorSearchAgent(
  userMessage: string,
  context: ClerkRequestContext
): Promise<AgentResult> {
  const tools = createDoctorTools(context);
  const toolNode = new ToolNode(tools);

  async function callModel(state: typeof MessagesAnnotation.State) {
    const messages = state.messages.map((m) => {
      let role: string;
      if (m._getType() === "human") {
        role = "user";
      } else if (m._getType() === "ai") {
        role = "assistant";
      } else if (m._getType() === "system") {
        role = "system";
      } else {
        role = "user";
      }
      return {
        role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      };
    });

    const toolDefs = tools.map((t) => {
      const raw: unknown = t.schema;
      const jsonSchema = (raw as { toJSON?: () => Record<string, unknown> }).toJSON?.() ?? {};
      const { properties, required } = jsonSchema as { properties?: Record<string, unknown>; required?: string[] };
      return {
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: "object",
            properties: properties ?? {},
            required: required ?? [],
          },
        },
      };
    });

  const response = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages,
      tools: toolDefs,
    });

    const result = (response as Record<string, unknown>).result as Record<string, unknown> | undefined;
    const assistantContent = (result?.response as string) ?? "";

    const rawToolCalls = (result?.tool_calls as Array<Record<string, unknown>>) ?? [];
    const toolCalls = rawToolCalls.map((tc) => {
      const name = (tc.name as string) ?? (tc.function as Record<string, unknown> | undefined)?.name as string ?? "";
      const args = tc.arguments ?? (tc.function as Record<string, unknown> | undefined)?.arguments ?? {};
      return {
        name,
        args: typeof args === "string" ? JSON.parse(args) as Record<string, unknown> : args as Record<string, unknown>,
        id: name,
        type: "tool_call" as const,
      };
    });

    return {
      messages: [new AIMessage({ content: assistantContent, tool_calls: toolCalls })],
    };
  }

  function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | typeof END {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray((lastMessage as AIMessage).tool_calls) &&
      (lastMessage as AIMessage).tool_calls!.length
    ) {
      return "tools";
    }
    return END;
  }

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent")
    .compile();

  const result = await graph.invoke({
    messages: [
      new SystemMessage(
        "You are a helpful medical assistant that helps users find doctors and learn about them. Use the available tools to search for doctors, get their profiles, and find doctors by specialty."
      ),
      new HumanMessage(userMessage),
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const rawContent = lastMessage && typeof lastMessage.content === "string"
    ? lastMessage.content
    : lastMessage
      ? JSON.stringify(lastMessage.content)
      : "";

  let { content, suggestions } = parseSuggestions(rawContent);

  if (suggestions.length === 0) {
    const history = result.messages
      .filter((m) => m._getType() !== "system")
      .map((m) => ({
        role: m._getType() === "human" ? "user" : "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));
    suggestions = await generateSuggestions(context, history);
  }

  return { content, suggestions };
}
