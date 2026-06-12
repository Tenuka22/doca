import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

import { chatGraph, type AgentState } from "./graph";

export type ChatEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-call-start"; toolName: string }
  | { type: "tool-call-end"; toolName: string }
  | { type: "doctor-reference"; doctorId: string; displayName: string }
  | { type: "related-doctors-mentioned"; doctors: Array<{ doctorId: string; displayName: string }> };

export async function* streamChatWorkflow(
  rawMessages: Array<{ role: string; content: string }>,
  ctx?: {
    userId: string | null;
    chatId: string;
    db: D1Database;
    chatHistoryKv: KVNamespace;
    doctorEmbeddingsKv: KVNamespace;
  } | null
): AsyncGenerator<ChatEvent> {
  console.log("streamChatWorkflow:start", { chatId: ctx?.chatId, userId: ctx?.userId ?? "anonymous", msgCount: rawMessages.length, authenticated: !!ctx?.userId })

  const inputMessages: BaseMessage[] = rawMessages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  const effectiveUserId = ctx?.userId ?? ""
  const effectiveChatId = ctx?.chatId ?? ""

  const config: Partial<LangGraphRunnableConfig> = {
    configurable: {
      userId: effectiveUserId,
      chatId: effectiveChatId,
      db: ctx?.db ?? null,
      chatHistoryKv: ctx?.chatHistoryKv,
      doctorEmbeddingsKv: ctx?.doctorEmbeddingsKv,
    },
  };

  console.log("streamChatWorkflow:graph:stream:starting")

  const stream = await chatGraph.stream(
    {
      new_messages: inputMessages,
      userId: effectiveUserId,
      chatId: effectiveChatId,
      messages: [],
    },
    { ...config, streamMode: "values" }
  ) as AsyncIterable<AgentState>;

  console.log("streamChatWorkflow:graph:stream:started")

  let stepCount = 0

  try {
    for await (const state of stream) {
      stepCount++
      const msgCount = state.messages.length
      const lastMessage = state.messages[msgCount - 1];
      if (!lastMessage) {
        console.log("streamChatWorkflow:step:no-last-message", { stepCount, msgCount })
        continue;
      }

      const msgType = lastMessage._getType()
      console.log("streamChatWorkflow:step", { stepCount, msgCount, msgType, hasToolCalls: lastMessage instanceof AIMessage ? !!lastMessage.tool_calls?.length : false })

      if (lastMessage instanceof AIMessage) {
        if (lastMessage.tool_calls?.length) {
          for (const toolCall of lastMessage.tool_calls) {
            console.log("streamChatWorkflow:yield:tool-call-start", { toolName: toolCall.name })
            yield { type: "tool-call-start", toolName: toolCall.name };
          }
        } else {
          const content =
            typeof lastMessage.content === "string"
              ? lastMessage.content
              : JSON.stringify(lastMessage.content);
          console.log("streamChatWorkflow:yield:text-delta", { contentLength: content.length })
          yield { type: "text-delta", text: content };
        }
      } else if (lastMessage instanceof ToolMessage) {
        console.log("streamChatWorkflow:yield:tool-call-end", { toolName: lastMessage.name })
        yield { type: "tool-call-end", toolName: lastMessage.name || "tool" };

        const rawContent =
          typeof lastMessage.content === "string"
            ? lastMessage.content
            : String(lastMessage.content)

        if (lastMessage.name === "get_doctor_details") {
          try {
            const result = JSON.parse(rawContent);
            if (result.userId && result.name) {
              console.log("streamChatWorkflow:yield:doctor-reference", { doctorId: result.userId })
              yield {
                type: "doctor-reference",
                doctorId: result.userId,
                displayName: result.name,
              };
              yield {
                type: "related-doctors-mentioned",
                doctors: [{ doctorId: result.userId, displayName: result.name }],
              };
            }
          } catch {
            // Ignore parse errors
          }
        }

        if (lastMessage.name === "get_doctors") {
          try {
            const entries = rawContent.split("\n\n---\n\n").filter(Boolean)
            const doctors = entries
              .map((e) => { try { return JSON.parse(e) } catch { return null } })
              .filter((d): d is { userId: string; displayName: string } => d !== null && d.userId && d.displayName)

            if (doctors.length > 0) {
              console.log("streamChatWorkflow:yield:related-doctors-mentioned", { count: doctors.length })
              yield {
                type: "related-doctors-mentioned",
                doctors: doctors.map((d) => ({ doctorId: d.userId, displayName: d.displayName })),
              };
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error("streamChatWorkflow:graph:error", error)
    throw error
  }

  console.log("streamChatWorkflow:end", { stepCount })
}
